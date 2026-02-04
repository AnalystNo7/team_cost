"""
Production Calendar Service for Russian Federation
Contains working days data for 2024-2027
"""
from typing import Dict, Tuple
from sqlalchemy.orm import Session
from app.models import WorkCalendar


# Production calendar data (working days per month)
# Source: consultant.ru / government decrees
WORK_CALENDAR_DATA: Dict[int, Dict[int, int]] = {
    2024: {
        1: 17, 2: 20, 3: 20, 4: 22, 5: 18, 6: 19,
        7: 23, 8: 22, 9: 21, 10: 23, 11: 20, 12: 21
    },
    2025: {
        1: 17, 2: 19, 3: 20, 4: 22, 5: 17, 6: 19,
        7: 23, 8: 21, 9: 22, 10: 23, 11: 19, 12: 22
    },
    2026: {
        1: 16, 2: 19, 3: 21, 4: 22, 5: 18, 6: 21,
        7: 23, 8: 21, 9: 22, 10: 22, 11: 20, 12: 22
    },
    2027: {
        1: 15, 2: 19, 3: 22, 4: 22, 5: 18, 6: 21,
        7: 22, 8: 22, 9: 22, 10: 21, 11: 21, 12: 22
    },
}


class CalendarService:
    @staticmethod
    def get_working_days(year: int, month: int) -> int:
        """Get working days for a specific month"""
        if year in WORK_CALENDAR_DATA and month in WORK_CALENDAR_DATA[year]:
            return WORK_CALENDAR_DATA[year][month]
        # Fallback: approximate calculation (average ~21 days)
        return 21

    @staticmethod
    def get_working_hours(year: int, month: int) -> int:
        """Get working hours for a specific month (8 hours per day)"""
        return CalendarService.get_working_days(year, month) * 8

    @staticmethod
    def parse_year_month(year_month: str) -> Tuple[int, int]:
        """Parse YYYY-MM string to (year, month) tuple"""
        parts = year_month.split("-")
        return int(parts[0]), int(parts[1])

    @staticmethod
    def get_months_in_range(start_month: str, end_month: str) -> list:
        """Get list of YYYY-MM strings in range"""
        start_year, start_m = CalendarService.parse_year_month(start_month)
        end_year, end_m = CalendarService.parse_year_month(end_month)

        months = []
        current_year, current_month = start_year, start_m

        while (current_year, current_month) <= (end_year, end_m):
            months.append(f"{current_year:04d}-{current_month:02d}")
            current_month += 1
            if current_month > 12:
                current_month = 1
                current_year += 1

        return months

    @staticmethod
    def init_calendar_data(db: Session):
        """Initialize work calendar table with data"""
        for year, months in WORK_CALENDAR_DATA.items():
            for month, working_days in months.items():
                existing = db.query(WorkCalendar).filter(
                    WorkCalendar.year == year,
                    WorkCalendar.month == month
                ).first()

                if not existing:
                    calendar_entry = WorkCalendar(
                        year=year,
                        month=month,
                        working_days=working_days,
                        working_hours=working_days * 8
                    )
                    db.add(calendar_entry)

        db.commit()
