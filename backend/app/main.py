from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    roles_router,
    rate_categories_router,
    calendar_router,
    calculations_router,
    export_router,
)
from app.utils import init_default_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and init data
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        init_default_data(db)
    finally:
        db.close()

    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Калькулятор расчёта стоимости проектной команды",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(roles_router, prefix="/api")
app.include_router(rate_categories_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(calculations_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
