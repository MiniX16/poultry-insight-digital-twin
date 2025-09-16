"""
API router for granja (farms) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import GranjaCreate, APIResponse
from app.services.database import create_granja

router = APIRouter(
    prefix="/granjas",
    tags=["granjas"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_granja_endpoint(granja_data: GranjaCreate):
    """
    Create a new farm
    
    This endpoint allows AWS IoT Core or other systems to create new farms in the system.
    """
    try:
        result = await create_granja(granja_data)
        
        return APIResponse(
            success=True,
            message="Granja created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating granja: {str(e)}"
        )