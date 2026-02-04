from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Team Cost Calculator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./data/team_cost.db"

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    # Tax rates (Russia 2024)
    PENSION_FUND_RATE: float = 0.22  # ПФР
    SOCIAL_INSURANCE_RATE: float = 0.029  # ФСС
    MEDICAL_INSURANCE_RATE: float = 0.051  # ФОМС

    # NDFL thresholds (progressive tax)
    NDFL_THRESHOLD_1: float = 2_400_000  # до 2.4 млн - 13%
    NDFL_THRESHOLD_2: float = 5_000_000  # до 5 млн - 15%
    NDFL_THRESHOLD_3: float = 20_000_000  # до 20 млн - 18%
    NDFL_THRESHOLD_4: float = 50_000_000  # до 50 млн - 20%
    # свыше 50 млн - 22%

    NDFL_RATE_1: float = 0.13
    NDFL_RATE_2: float = 0.15
    NDFL_RATE_3: float = 0.18
    NDFL_RATE_4: float = 0.20
    NDFL_RATE_5: float = 0.22

    # Insurance contribution limits (2024)
    UNIFIED_SOCIAL_TAX_LIMIT: float = 2_225_000  # Единая предельная база

    class Config:
        env_file = ".env"


settings = Settings()
