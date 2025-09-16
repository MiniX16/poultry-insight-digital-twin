"""
API router for consumo (consumption) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import ConsumoCreate, APIResponse
from app.services.database import create_consumo

router = APIRouter(
    prefix="/consumo",
    tags=["consumo"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_consumo_endpoint(consumo_data: ConsumoCreate):
    """
    Create a new consumption record
    
    This endpoint allows AWS IoT Core or other systems to record consumption data.
    """
    try:
        result = await create_consumo(consumo_data)
        
        return APIResponse(
            success=True,
            message="Consumo record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating consumo: {str(e)}"
        )