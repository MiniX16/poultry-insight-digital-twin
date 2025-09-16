"""
API router for lote (batches/lots) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import LoteCreate, APIResponse
from app.services.database import create_lote

router = APIRouter(
    prefix="/lotes",
    tags=["lotes"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_lote_endpoint(lote_data: LoteCreate):
    """
    Create a new batch/lot
    
    This endpoint allows AWS IoT Core or other systems to create new batches in the system.
    """
    try:
        result = await create_lote(lote_data)
        
        return APIResponse(
            success=True,
            message="Lote created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating lote: {str(e)}"
        )