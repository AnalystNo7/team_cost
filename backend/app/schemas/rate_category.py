from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class RateCategoryBase(BaseModel):
    code: str
    name: Optional[str] = None
    hourly_rate: Decimal


class RateCategoryCreate(RateCategoryBase):
    pass


class RateCategoryUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None


class RateCategoryResponse(RateCategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
