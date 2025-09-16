"""
API router for medicion_ambiental (environmental measurements) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import MedicionAmbientalCreate, APIResponse
from app.services.database import create_medicion_ambiental

router = APIRouter(
    prefix="/medicion-ambiental",
    tags=["medicion-ambiental"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_medicion_ambiental_endpoint(medicion_data: MedicionAmbientalCreate):
    """
    Create a new environmental measurement record
    
    This endpoint allows AWS IoT Core or other systems to record environmental sensor data.
    """
    try:
        result = await create_medicion_ambiental(medicion_data)
        
        return APIResponse(
            success=True,
            message="Medicion ambiental record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating medicion ambiental: {str(e)}"
        )