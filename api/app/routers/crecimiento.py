"""
API router for crecimiento (growth) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import CrecimientoCreate, APIResponse
from app.services.database import create_crecimiento

router = APIRouter(
    prefix="/crecimiento",
    tags=["crecimiento"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_crecimiento_endpoint(crecimiento_data: CrecimientoCreate):
    """
    Create a new growth record
    
    This endpoint allows AWS IoT Core or other systems to record growth data.
    """
    try:
        result = await create_crecimiento(crecimiento_data)
        
        return APIResponse(
            success=True,
            message="Crecimiento record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating crecimiento: {str(e)}"
        )