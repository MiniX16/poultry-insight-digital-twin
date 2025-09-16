"""
API router for alimentacion (feeding) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import AlimentacionCreate, APIResponse
from app.services.database import create_alimentacion

router = APIRouter(
    prefix="/alimentacion",
    tags=["alimentacion"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_alimentacion_endpoint(alimentacion_data: AlimentacionCreate):
    """
    Create a new feeding record
    
    This endpoint allows AWS IoT Core or other systems to record feeding data.
    """
    try:
        result = await create_alimentacion(alimentacion_data)
        
        return APIResponse(
            success=True,
            message="Alimentacion record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating alimentacion: {str(e)}"
        )