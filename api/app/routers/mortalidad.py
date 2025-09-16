"""
API router for mortalidad (mortality) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import MortalidadCreate, APIResponse
from app.services.database import create_mortalidad

router = APIRouter(
    prefix="/mortalidad",
    tags=["mortalidad"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_mortalidad_endpoint(mortalidad_data: MortalidadCreate):
    """
    Create a new mortality record
    
    This endpoint allows AWS IoT Core or other systems to record mortality events.
    """
    try:
        result = await create_mortalidad(mortalidad_data)
        
        return APIResponse(
            success=True,
            message="Mortalidad record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating mortalidad: {str(e)}"
        )