"""
API router for mapa_termico (thermal maps) endpoints
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import MapaTermicoCreate, APIResponse
from app.services.database import create_mapa_termico

router = APIRouter(
    prefix="/mapa-termico",
    tags=["mapa-termico"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_mapa_termico_endpoint(mapa_data: MapaTermicoCreate):
    """
    Create a new thermal map record
    
    This endpoint allows AWS IoT Core or other systems to record thermal map data.
    """
    try:
        result = await create_mapa_termico(mapa_data)
        
        return APIResponse(
            success=True,
            message="Mapa termico record created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating mapa termico: {str(e)}"
        )