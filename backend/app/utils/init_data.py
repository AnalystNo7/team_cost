"""
Initialize default data for the application
"""
from sqlalchemy.orm import Session
from app.models import Role, RateCategory
from app.services.calendar_service import CalendarService


DEFAULT_ROLES = [
    "Руководитель проекта",
    "Архитектор/тим-лид",
    "Тестировщик",
    "Бизнес-аналитик",
    "Системный аналитик",
    "DevOps инженер",
    "Разработчик (Backend)",
    "Разработчик (Frontend)",
    "Дизайнер",
    "Методолог",
    "Технический писатель",
    "Ведущий инженер СТИ",
    "Архитектор СТИ",
    "Инженер ПОИБ",
    "Специалист информационной безопасности",
]

DEFAULT_RATE_CATEGORIES = [
    {"code": "K1", "name": "Категория K1", "hourly_rate": 1140},
    {"code": "K2", "name": "Категория K2", "hourly_rate": 1750},
    {"code": "K3", "name": "Категория K3", "hourly_rate": 2300},
    {"code": "K4", "name": "Категория K4", "hourly_rate": 3050},
    {"code": "K5", "name": "Категория K5", "hourly_rate": 4100},
    {"code": "K6", "name": "Категория K6", "hourly_rate": 6800},
]


def init_default_data(db: Session):
    """Initialize default roles, rate categories, and calendar data"""

    # Initialize roles
    for role_name in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == role_name).first()
        if not existing:
            role = Role(name=role_name)
            db.add(role)

    # Initialize rate categories
    for cat_data in DEFAULT_RATE_CATEGORIES:
        existing = db.query(RateCategory).filter(RateCategory.code == cat_data["code"]).first()
        if not existing:
            category = RateCategory(**cat_data)
            db.add(category)

    db.commit()

    # Initialize work calendar
    CalendarService.init_calendar_data(db)
