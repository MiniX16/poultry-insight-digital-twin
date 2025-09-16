"""
API router for pollo (individual chickens) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import PolloCreate, APIResponse
from app.services.database import create_pollo

router = APIRouter(
    prefix="/pollos",
    tags=["pollos"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_pollo_endpoint(pollo_data: PolloCreate):
    """
    Create a new individual chicken record
    
    This endpoint allows AWS IoT Core or other systems to create new chicken records in the system.
    """
    try:
        result = await create_pollo(pollo_data)
        
        return APIResponse(
            success=True,
            message="Pollo created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating pollo: {str(e)}"
        )