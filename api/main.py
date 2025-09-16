"""
FastAPI application for Poultry Management System API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings

# Create FastAPI instance
app = FastAPI(
    title="Poultry Management API",
    description="API for managing poultry farm data and operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "message": "Poultry Management API is running",
            "version": "1.0.0"
        }
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Poultry Management API",
        "docs": "/docs",
        "health": "/health"
    }

# Include API routers
from app.routers import (
    usuarios, granjas, lotes, pollos, crecimiento,
    consumo, alimentacion, medicion_ambiental, mortalidad, mapa_termico
)

# Add all routers with API version prefix
app.include_router(usuarios.router, prefix="/api/v1")
app.include_router(granjas.router, prefix="/api/v1")
app.include_router(lotes.router, prefix="/api/v1")
app.include_router(pollos.router, prefix="/api/v1")
app.include_router(crecimiento.router, prefix="/api/v1")
app.include_router(consumo.router, prefix="/api/v1")
app.include_router(alimentacion.router, prefix="/api/v1")
app.include_router(medicion_ambiental.router, prefix="/api/v1")
app.include_router(mortalidad.router, prefix="/api/v1")
app.include_router(mapa_termico.router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )