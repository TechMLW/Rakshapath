from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey
)

from sqlalchemy.sql import func
from geoalchemy2 import Geometry

from database import Base


# =========================
# USERS TABLE
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =========================
# REPORTS TABLE
# =========================

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    report_type = Column(String(50), nullable=False)

    description = Column(Text)

    severity = Column(String(20), default="medium")

    # Latitude / Longitude stored using PostGIS
    location = Column(
        Geometry(
            geometry_type="POINT",
            srid=4326
        ),
        nullable=False
    )

    status = Column(String(20), default="pending")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# =========================
# ROADS TABLE
# =========================

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False)

    road_type = Column(String(50))

    condition = Column(String(50))

    risk_score = Column(Float, default=0)

    # Road represented as a geographic line
    geometry = Column(
        Geometry(
            geometry_type="LINESTRING",
            srid=4326
        )
    )


# =========================
# ROUTES TABLE
# =========================

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    start_location = Column(
        Geometry(
            geometry_type="POINT",
            srid=4326
        )
    )

    destination = Column(
        Geometry(
            geometry_type="POINT",
            srid=4326
        )
    )

    distance = Column(Float)

    estimated_time = Column(Float)

    safety_score = Column(Float)

    risk_level = Column(String(20))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# =========================
# NOTIFICATIONS TABLE
# =========================

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        String,
        nullable=False
    )

    notification_type = Column(
        String,
        default="safety_alert"
    )

    is_read = Column(
        Boolean,
        default=False
    )