from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProjectVersion
from app.services.cost_calculator import CostCalculatorService
from app.services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/projects/{project_id}/versions/{version_id}/excel")
def export_excel(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Export project version to Excel"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    result = CostCalculatorService.calculate_version(db, version_id)
    excel_data = ExportService.export_to_excel(result)

    filename = f"project_{project_id}_v{version.version_number}.xlsx"
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/projects/{project_id}/versions/{version_id}/pdf")
def export_pdf(project_id: int, version_id: int, db: Session = Depends(get_db)):
    """Export project version to PDF"""
    version = db.query(ProjectVersion).filter(
        ProjectVersion.id == version_id,
        ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    result = CostCalculatorService.calculate_version(db, version_id)
    pdf_data = ExportService.export_to_pdf(result)

    filename = f"project_{project_id}_v{version.version_number}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
