"""
ai/report_verification.py
---------------------------
Community Verification Engine.

Runs every incoming community report through a sequential pipeline before
it is allowed to touch VerifiedReports / influence routing:

  1. Duplicate detection
  2. GPS verification
  3. Timestamp validation
  4. Image validation
  5. Nearby user confirmation
  6. Reputation scoring
  7. Confidence scoring

A report can be REJECTED at any stage. Reaching the end of the pipeline
does not guarantee routing impact by itself — the resulting confidence
score is what report_verification hands off to ai/safety_score.py, which
decides how much weight (if any) to give it.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional


class VerificationStatus(Enum):
    PENDING = "pending"
    REJECTED_DUPLICATE = "rejected_duplicate"
    REJECTED_GPS = "rejected_gps_mismatch"
    REJECTED_TIMESTAMP = "rejected_stale_timestamp"
    REJECTED_IMAGE = "rejected_image_invalid"
    VERIFIED = "verified"


@dataclass
class IncidentReport:
    report_id: str
    user_id: str
    incident_type: str          # accident | flood | pothole | road_block | construction | fire | crime
    latitude: float
    longitude: float
    reported_at: datetime
    has_image: bool
    image_hash: Optional[str] = None
    description: str = ""


@dataclass
class ExistingReport:
    """Minimal shape of previously-stored reports, used for duplicate and
    nearby-confirmation checks."""
    report_id: str
    incident_type: str
    latitude: float
    longitude: float
    reported_at: datetime
    image_hash: Optional[str] = None


@dataclass
class VerificationResult:
    report_id: str
    status: VerificationStatus
    confidence: float                # 0-100
    reputation_weight: float         # 0-1, from ai/report_verification's reputation lookup
    nearby_confirmations: int
    reasons: List[str] = field(default_factory=list)

    @property
    def is_verified(self) -> bool:
        return self.status == VerificationStatus.VERIFIED


def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


class ReportVerificationPipeline:
    def __init__(
        self,
        duplicate_radius_m: float = 150.0,
        duplicate_window_minutes: int = 30,
        max_report_age_minutes: int = 120,
        nearby_confirm_radius_m: float = 300.0,
        nearby_confirm_window_minutes: int = 60,
        min_confirmations_for_full_confidence: int = 2,
    ):
        self.duplicate_radius_m = duplicate_radius_m
        self.duplicate_window_minutes = duplicate_window_minutes
        self.max_report_age_minutes = max_report_age_minutes
        self.nearby_confirm_radius_m = nearby_confirm_radius_m
        self.nearby_confirm_window_minutes = nearby_confirm_window_minutes
        self.min_confirmations_for_full_confidence = min_confirmations_for_full_confidence

    # ---- pipeline stages -------------------------------------------------

    def _check_duplicate(self, report: IncidentReport, existing: List[ExistingReport]) -> bool:
        window_start = report.reported_at - timedelta(minutes=self.duplicate_window_minutes)
        for e in existing:
            if e.incident_type != report.incident_type:
                continue
            if not (window_start <= e.reported_at <= report.reported_at):
                continue
            if _haversine_m(report.latitude, report.longitude, e.latitude, e.longitude) <= self.duplicate_radius_m:
                return True
        return False

    def _check_gps(self, report: IncidentReport) -> bool:
        # Sanity bounds check + zero-island guard (0,0 is a classic spoof/default value)
        if not (-90 <= report.latitude <= 90 and -180 <= report.longitude <= 180):
            return False
        if abs(report.latitude) < 0.0001 and abs(report.longitude) < 0.0001:
            return False
        return True

    def _check_timestamp(self, report: IncidentReport, now: datetime) -> bool:
        if report.reported_at > now + timedelta(minutes=2):  # clock-skew tolerance
            return False
        age = (now - report.reported_at).total_seconds() / 60.0
        return age <= self.max_report_age_minutes

    def _check_image(self, report: IncidentReport) -> bool:
        incident_types_requiring_image = {"accident", "flood", "pothole", "road_block", "fire"}
        if report.incident_type in incident_types_requiring_image:
            return report.has_image and bool(report.image_hash)
        return True  # e.g. "crime" reports may reasonably omit an image

    def _count_nearby_confirmations(self, report: IncidentReport, existing: List[ExistingReport]) -> int:
        window_start = report.reported_at - timedelta(minutes=self.nearby_confirm_window_minutes)
        count = 0
        for e in existing:
            if e.report_id == report.report_id or e.incident_type != report.incident_type:
                continue
            if not (window_start <= e.reported_at <= report.reported_at + timedelta(minutes=self.nearby_confirm_window_minutes)):
                continue
            if _haversine_m(report.latitude, report.longitude, e.latitude, e.longitude) <= self.nearby_confirm_radius_m:
                count += 1
        return count

    # ---- orchestration -----------------------------------------------------

    def verify(
        self,
        report: IncidentReport,
        existing_reports: List[ExistingReport],
        reporter_reputation: float,     # 0-1, from community/reputation.py
        now: Optional[datetime] = None,
    ) -> VerificationResult:
        now = now or datetime.now(timezone.utc)
        reasons = []

        if self._check_duplicate(report, existing_reports):
            reasons.append("Matches an existing report of the same type within radius/window")
            return VerificationResult(report.report_id, VerificationStatus.REJECTED_DUPLICATE, 0.0, reporter_reputation, 0, reasons)

        if not self._check_gps(report):
            reasons.append("GPS coordinates failed sanity/spoof check")
            return VerificationResult(report.report_id, VerificationStatus.REJECTED_GPS, 0.0, reporter_reputation, 0, reasons)

        if not self._check_timestamp(report, now):
            reasons.append("Timestamp is in the future or older than the freshness window")
            return VerificationResult(report.report_id, VerificationStatus.REJECTED_TIMESTAMP, 0.0, reporter_reputation, 0, reasons)

        if not self._check_image(report):
            reasons.append("Required image evidence missing or unreadable")
            return VerificationResult(report.report_id, VerificationStatus.REJECTED_IMAGE, 0.0, reporter_reputation, 0, reasons)

        nearby = self._count_nearby_confirmations(report, existing_reports)
        confirmation_ratio = min(nearby / self.min_confirmations_for_full_confidence, 1.0)

        # Confidence blends: base pass (40%) + reputation (30%) + nearby confirmation (30%)
        confidence = 40 + reporter_reputation * 30 + confirmation_ratio * 30
        confidence = round(min(99.0, confidence), 1)

        reasons.append("Passed duplicate/GPS/timestamp/image checks")
        reasons.append(f"{nearby} nearby confirming report(s) within {self.nearby_confirm_radius_m:.0f}m")

        return VerificationResult(
            report_id=report.report_id,
            status=VerificationStatus.VERIFIED,
            confidence=confidence,
            reputation_weight=reporter_reputation,
            nearby_confirmations=nearby,
            reasons=reasons,
        )


if __name__ == "__main__":
    now = datetime.now(timezone.utc)
    pipeline = ReportVerificationPipeline()

    existing = [
        ExistingReport("R-001", "flood", 12.9720, 77.5940, now - timedelta(minutes=20)),
    ]

    new_report = IncidentReport(
        report_id="R-002",
        user_id="U-77",
        incident_type="flood",
        latitude=12.9725,
        longitude=77.5945,
        reported_at=now - timedelta(minutes=2),
        has_image=True,
        image_hash="abc123",
    )

    result = pipeline.verify(new_report, existing, reporter_reputation=0.82, now=now)
    print("Duplicate case:", result)

    fresh_report = IncidentReport(
        report_id="R-003",
        user_id="U-88",
        incident_type="pothole",
        latitude=12.9800,
        longitude=77.6000,
        reported_at=now - timedelta(minutes=1),
        has_image=True,
        image_hash="def456",
    )
    result2 = pipeline.verify(fresh_report, existing, reporter_reputation=0.9, now=now)
    print("Fresh, verifiable case:", result2)
