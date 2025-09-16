"""
API router for usuario (users) endpoints
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.schemas import UsuarioCreate, APIResponse, ErrorResponse
from app.services.database import create_usuario

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_usuario_endpoint(usuario_data: UsuarioCreate):
    """
    Create a new user
    
    This endpoint allows AWS IoT Core or other systems to create new users in the system.
    """
    try:
        result = await create_usuario(usuario_data)
        
        return APIResponse(
            success=True,
            message="Usuario created successfully",
            data=result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating usuario: {str(e)}"
        )