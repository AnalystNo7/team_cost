from pydantic import BaseModel
from datetime import datetime


class WorkCalendarBase(BaseModel):
    year: int
    month: int
    working_days: int
    working_hours: int


class WorkCalendarResponse(WorkCalendarBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
