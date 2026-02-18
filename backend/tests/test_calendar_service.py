"""
Tests for CalendarService
Verifies working days/hours from hardcoded data and date range utilities.
"""
import pytest
from app.services.calendar_service import CalendarService, WORK_CALENDAR_DATA


class TestGetWorkingDays:
    """Test working days retrieval from hardcoded calendar data."""

    def test_known_month_jan_2025(self):
        # January 2025: official 17 working days
        assert CalendarService.get_working_days(2025, 1) == 17

    def test_known_month_feb_2025(self):
        assert CalendarService.get_working_days(2025, 2) == 19

    def test_known_month_jul_2025(self):
        # July 2025: 23 working days (full month, no major holidays)
        assert CalendarService.get_working_days(2025, 7) == 23

    def test_all_months_2025_sum(self):
        # Total working days in 2025 should be 244
        total = sum(WORK_CALENDAR_DATA[2025].values())
        assert total == 244

    def test_unknown_year_returns_default(self):
        # Year not in data should return 21 (default)
        assert CalendarService.get_working_days(2050, 6) == 21

    def test_all_years_have_12_months(self):
        for year, months in WORK_CALENDAR_DATA.items():
            assert len(months) == 12, f"Year {year} has {len(months)} months"


class TestGetWorkingHours:
    """Test working hours (8h per working day)."""

    def test_hours_jan_2025(self):
        # 17 days * 8 hours = 136
        assert CalendarService.get_working_hours(2025, 1) == 136

    def test_hours_jul_2025(self):
        # 23 days * 8 hours = 184
        assert CalendarService.get_working_hours(2025, 7) == 184

    def test_hours_unknown_year(self):
        # Default 21 days * 8 = 168
        assert CalendarService.get_working_hours(2050, 1) == 168


class TestParseYearMonth:
    def test_standard_format(self):
        assert CalendarService.parse_year_month("2025-03") == (2025, 3)

    def test_december(self):
        assert CalendarService.parse_year_month("2026-12") == (2026, 12)


class TestGetMonthsInRange:
    def test_single_month(self):
        result = CalendarService.get_months_in_range("2025-06", "2025-06")
        assert result == ["2025-06"]

    def test_same_year(self):
        result = CalendarService.get_months_in_range("2025-01", "2025-03")
        assert result == ["2025-01", "2025-02", "2025-03"]

    def test_cross_year(self):
        result = CalendarService.get_months_in_range("2025-11", "2026-02")
        assert result == ["2025-11", "2025-12", "2026-01", "2026-02"]


class TestGetMonthsFromDates:
    def test_date_range(self):
        from datetime import date
        result = CalendarService.get_months_from_dates(
            date(2025, 3, 15), date(2025, 6, 20)
        )
        assert result == ["2025-03", "2025-04", "2025-05", "2025-06"]


class TestGetWorkingDaysInPeriod:
    def test_full_month(self):
        from datetime import date
        # Full January 2025 should return all 17 working days
        result = CalendarService.get_working_days_in_period(
            date(2025, 1, 1), date(2025, 1, 31), 2025, 1
        )
        assert result == 17

    def test_half_month(self):
        from datetime import date
        # First half of January 2025 (1-15 out of 31 days)
        # 17 * 15/31 ≈ 8.2 → rounds to 8
        result = CalendarService.get_working_days_in_period(
            date(2025, 1, 1), date(2025, 1, 15), 2025, 1
        )
        assert result == round(17 * 15 / 31)

    def test_outside_period(self):
        from datetime import date
        # Period that doesn't intersect with the month
        result = CalendarService.get_working_days_in_period(
            date(2025, 3, 1), date(2025, 3, 31), 2025, 1
        )
        assert result == 0
