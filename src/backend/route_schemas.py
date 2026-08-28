from typing import Literal
from pydantic import BaseModel, Field, field_validator


class RouteRequest(BaseModel):
    start_latitude: float = Field(..., ge=-90.0, le=90.0, description="Origin latitude (-90 to 90)")
    start_longitude: float = Field(..., ge=-180.0, le=180.0, description="Origin longitude (-180 to 180)")
    destination_latitude: float = Field(..., ge=-90.0, le=90.0, description="Destination latitude (-90 to 90)")
    destination_longitude: float = Field(..., ge=-180.0, le=180.0, description="Destination longitude (-180 to 180)")
    profile: Literal["fastest", "safest", "balanced"] = "balanced"
    region: str = Field(default="bhubaneswar", description="Target region/network identifier")
    dynamic_weights: dict | None = None

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        clean = v.strip().lower().replace(" ", "_")
        return clean or "bhubaneswar"


class RerouteRequest(BaseModel):
    current_latitude: float = Field(..., ge=-90.0, le=90.0, description="Current latitude (-90 to 90)")
    current_longitude: float = Field(..., ge=-180.0, le=180.0, description="Current longitude (-180 to 180)")
    destination_latitude: float = Field(..., ge=-90.0, le=90.0, description="Destination latitude (-90 to 90)")
    destination_longitude: float = Field(..., ge=-180.0, le=180.0, description="Destination longitude (-180 to 180)")
    current_route: list[int] | None = None
    current_node_index: int = Field(default=0, ge=0)
    profile: Literal["fastest", "safest", "balanced"] = "balanced"
    region: str = Field(default="bhubaneswar", description="Target region/network identifier")
    dynamic_weights: dict | None = None
    cost_increase_threshold: float = Field(default=1.15, ge=1.0, le=10.0)

    @field_validator("region")
    @classmethod
    def validate_region(cls, v: str) -> str:
        clean = v.strip().lower().replace(" ", "_")
        return clean or "bhubaneswar"