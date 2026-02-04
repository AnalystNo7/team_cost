from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.database import Base


class WorkCalendar(Base):
    __tablename__ = "work_calendar"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    working_days = Column(Integer, nullable=False)
    working_hours = Column(Integer, nullable=False)  # working_days * 8
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    class Meta:
        unique_together = ('year', 'month')
