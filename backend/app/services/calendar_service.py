"""
Production Calendar Service for Russian Federation
Contains working days data for 2025-2035
Source: consultant.ru / government decrees (for known years)
Future years use typical patterns based on historical data
"""
from typing import Dict, Optional, Tuple
from datetime import date
from sqlalchemy.orm import Session
from app.models import WorkCalendar


# Production calendar data (working days per month)
# 2025 - Official data from government decree
# 2026-2027 - Projected based on calendar (weekends only, no holidays adjustments yet)
# 2028-2035 - Projected using typical patterns
WORK_CALENDAR_DATA: Dict[int, Dict[int, int]] = {
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
    2028: {
        1: 17, 2: 20, 3: 22, 4: 20, 5: 20, 6: 21,
        7: 21, 8: 23, 9: 21, 10: 22, 11: 21, 12: 21
    },
    2029: {
        1: 17, 2: 19, 3: 21, 4: 21, 5: 20, 6: 21,
        7: 22, 8: 23, 9: 20, 10: 23, 11: 21, 12: 21
    },
    2030: {
        1: 17, 2: 19, 3: 20, 4: 22, 5: 18, 6: 19,
        7: 23, 8: 22, 9: 21, 10: 23, 11: 20, 12: 22
    },
    2031: {
        1: 17, 2: 19, 3: 21, 4: 22, 5: 17, 6: 20,
        7: 23, 8: 21, 9: 22, 10: 23, 11: 19, 12: 22
    },
    2032: {
        1: 16, 2: 20, 3: 22, 4: 22, 5: 18, 6: 21,
        7: 22, 8: 22, 9: 22, 10: 22, 11: 20, 12: 22
    },
    2033: {
        1: 15, 2: 19, 3: 22, 4: 21, 5: 18, 6: 21,
        7: 21, 8: 23, 9: 22, 10: 21, 11: 21, 12: 22
    },
    2034: {
        1: 17, 2: 19, 3: 22, 4: 20, 5: 20, 6: 21,
        7: 21, 8: 23, 9: 21, 10: 22, 11: 21, 12: 21
    },
    2035: {
        1: 17, 2: 19, 3: 21, 4: 21, 5: 20, 6: 21,
        7: 22, 8: 23, 9: 20, 10: 23, 11: 21, 12: 21
    },
}


class CalendarService:
    @staticmethod
    def get_working_days(year: int, month: int, db: Optional[Session] = None) -> int:
        """Get working days for a specific month. Reads from DB first, falls back to hardcoded data."""
        if db is not None:
            entry = db.query(WorkCalendar).filter(
                WorkCalendar.year == year,
                WorkCalendar.month == month
            ).first()
            if entry:
                return entry.working_days

        # Fallback to hardcoded data
        if year in WORK_CALENDAR_DATA and month in WORK_CALENDAR_DATA[year]:
            return WORK_CALENDAR_DATA[year][month]
        # Fallback: approximate calculation (average ~21 days)
        return 21

    @staticmethod
    def get_working_hours(year: int, month: int, db: Optional[Session] = None) -> int:
        """Get working hours for a specific month (8 hours per day). Reads from DB first."""
        return CalendarService.get_working_days(year, month, db) * 8

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
    def get_months_from_dates(start_date: date, end_date: date) -> list:
        """Get list of YYYY-MM strings from date range"""
        start_month = f"{start_date.year:04d}-{start_date.month:02d}"
        end_month = f"{end_date.year:04d}-{end_date.month:02d}"
        return CalendarService.get_months_in_range(start_month, end_month)

    @staticmethod
    def get_working_days_in_period(start_date: date, end_date: date, year: int, month: int) -> int:
        """
        Get working days for a specific month, adjusted for partial months.
        If the stage starts or ends mid-month, calculate proportionally.
        """
        total_working_days = CalendarService.get_working_days(year, month)

        # Get first and last day of the month
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)

        # Calculate actual period within this month
        period_start = max(start_date, month_start)
        period_end = min(end_date, month_end)

        if period_start > period_end:
            return 0

        # If full month, return all working days
        if period_start == month_start and period_end == month_end:
            return total_working_days

        # Calculate proportion of month covered
        total_days = (month_end - month_start).days + 1
        covered_days = (period_end - period_start).days + 1

        # Proportional working days (rounded)
        return round(total_working_days * covered_days / total_days)

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
