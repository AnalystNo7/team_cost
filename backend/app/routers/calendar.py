from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import WorkCalendar
from app.schemas import WorkCalendarResponse
from app.services.calendar_service import CalendarService

router = APIRouter(prefix="/calendar", tags=["Work Calendar"])


@router.get("/", response_model=List[WorkCalendarResponse])
def get_calendar(
    db: Session = Depends(get_db),
    year: int = None
):
    """Get work calendar data"""
    query = db.query(WorkCalendar)
    if year:
        query = query.filter(WorkCalendar.year == year)
    return query.order_by(WorkCalendar.year, WorkCalendar.month).all()


@router.get("/{year}/{month}")
def get_working_days(year: int, month: int):
    """Get working days for specific month"""
    working_days = CalendarService.get_working_days(year, month)
    working_hours = CalendarService.get_working_hours(year, month)
    return {
        "year": year,
        "month": month,
        "working_days": working_days,
        "working_hours": working_hours
    }


@router.get("/range/{start_month}/{end_month}")
def get_months_in_range(start_month: str, end_month: str):
    """Get all months in range with working days"""
    months = CalendarService.get_months_in_range(start_month, end_month)
    result = []
    for month in months:
        year, m = CalendarService.parse_year_month(month)
        result.append({
            "year_month": month,
            "working_days": CalendarService.get_working_days(year, m),
            "working_hours": CalendarService.get_working_hours(year, m)
        })
    return result
