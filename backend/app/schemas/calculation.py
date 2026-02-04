from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.calculation import MethodologyType


class CalculationBase(BaseModel):
    name: str
    description: Optional[str] = None
    methodology: MethodologyType
    start_date: str  # YYYY-MM
    end_date: str  # YYYY-MM


class CalculationCreate(CalculationBase):
    pass


class CalculationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    methodology: Optional[MethodologyType] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CalculationResponse(CalculationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalculationVersionCreate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool = False


class CalculationVersionResponse(BaseModel):
    id: int
    calculation_id: int
    version_number: int
    name: Optional[str] = None
    notes: Optional[str] = None
    is_baseline: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CalculationDetailResponse(CalculationResponse):
    versions: List[CalculationVersionResponse] = []
