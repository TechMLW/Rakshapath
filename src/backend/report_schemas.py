from pydantic import BaseModel


class ReportCreate(BaseModel):
    report_type: str
    description: str
    severity: str
    latitude: float
    longitude: float