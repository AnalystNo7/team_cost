from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CalculationVersion
from app.services.cost_calculator import CostCalculatorService
from app.services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/{calc_id}/versions/{version_id}/excel")
def export_excel(calc_id: int, version_id: int, db: Session = Depends(get_db)):
    """Export calculation to Excel"""
    version = db.query(CalculationVersion).filter(
        CalculationVersion.id == version_id,
        CalculationVersion.calculation_id == calc_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    result = CostCalculatorService.calculate_version(db, version_id)
    excel_data = ExportService.export_to_excel(result)

    filename = f"calculation_{calc_id}_v{version.version_number}.xlsx"
    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{calc_id}/versions/{version_id}/pdf")
def export_pdf(calc_id: int, version_id: int, db: Session = Depends(get_db)):
    """Export calculation to PDF"""
    version = db.query(CalculationVersion).filter(
        CalculationVersion.id == version_id,
        CalculationVersion.calculation_id == calc_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    result = CostCalculatorService.calculate_version(db, version_id)
    pdf_data = ExportService.export_to_pdf(result)

    filename = f"calculation_{calc_id}_v{version.version_number}.pdf"
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
