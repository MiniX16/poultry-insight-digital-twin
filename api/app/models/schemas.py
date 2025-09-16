"""
Pydantic models for poultry management system data structures
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


# Enums for constrained values
class EstadoLote(str, Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    VENDIDO = "vendido"


class EstadoSalud(str, Enum):
    SALUDABLE = "saludable"
    ENFERMO = "enfermo"
    RECUPERANDOSE = "recuperandose"


class TipoAlimento(str, Enum):
    PRE_INICIADOR = "Pre-iniciador"
    INICIADOR = "Iniciador"
    CRECIMIENTO = "Crecimiento"
    FINALIZADOR = "Finalizador"


# Base models for creation (without IDs)
class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    contacto: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    email: str = Field(..., max_length=100)
    direccion: Optional[str] = Field(None, max_length=200)
    contraseña: str = Field(..., min_length=8)


class GranjaCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    capacidad: int = Field(..., gt=0)
    ubicacion: Optional[str] = Field(None, max_length=200)
    usuario_id: int = Field(..., gt=0)


class LoteCreate(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    fecha_ingreso: date
    cantidad_inicial: int = Field(..., gt=0)
    raza: str = Field(..., min_length=1, max_length=100)
    granja_id: int = Field(..., gt=0)
    estado: EstadoLote = EstadoLote.ACTIVO


class PolloCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    identificador: str = Field(..., min_length=1, max_length=50)
    peso: float = Field(..., gt=0)  # in grams
    estado_salud: EstadoSalud = EstadoSalud.SALUDABLE
    fecha_registro: datetime


class CrecimientoCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha: date
    peso_promedio: float = Field(..., gt=0)  # in grams
    ganancia_diaria: Optional[float] = Field(None, ge=0)  # in grams per day
    uniformidad: Optional[float] = Field(None, ge=0, le=100)  # percentage


class ConsumoCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha_hora: datetime
    cantidad_agua: float = Field(..., gt=0)  # in liters
    cantidad_alimento: float = Field(..., gt=0)  # in kg
    tipo_alimento: TipoAlimento
    desperdicio: Optional[float] = Field(None, ge=0)  # in kg
    kwh: Optional[float] = Field(None, ge=0)  # energy consumption


class AlimentacionCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha: datetime
    tipo_alimento: TipoAlimento
    cantidad_suministrada: float = Field(..., gt=0)  # in kg
    hora_suministro: Optional[str] = Field(None)  # HH:MM format
    responsable: str = Field(..., min_length=1, max_length=100)


class MedicionAmbientalCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha_hora: datetime
    temperatura: float = Field(..., ge=-50, le=100)  # celsius
    humedad: float = Field(..., ge=0, le=100)  # percentage
    ubicacion: Optional[str] = Field(None, max_length=100)
    co2: Optional[float] = Field(None, ge=0)  # ppm
    amoniaco: Optional[float] = Field(None, ge=0)  # ppm
    iluminacion: Optional[float] = Field(None, ge=0)  # lux
    observaciones: Optional[str] = Field(None, max_length=500)


class MortalidadCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha: date
    cantidad: int = Field(..., gt=0)
    causa: Optional[str] = Field(None, max_length=200)


class MapaTermicoCreate(BaseModel):
    lote_id: int = Field(..., gt=0)
    fecha: datetime
    temperaturas: List[List[float]] = Field(..., description="2D grid of temperatures")
    
    @validator('temperaturas')
    def validate_temperature_grid(cls, v):
        if not v or not all(isinstance(row, list) for row in v):
            raise ValueError('temperaturas must be a 2D list')
        if not all(all(isinstance(temp, (int, float)) for temp in row) for row in v):
            raise ValueError('All temperature values must be numbers')
        return v


# Response models (with IDs) - for future use
class Usuario(UsuarioCreate):
    usuario_id: int
    
    class Config:
        from_attributes = True


class Granja(GranjaCreate):
    granja_id: int
    
    class Config:
        from_attributes = True


class Lote(LoteCreate):
    lote_id: int
    
    class Config:
        from_attributes = True


class Pollo(PolloCreate):
    pollo_id: int
    
    class Config:
        from_attributes = True


class Crecimiento(CrecimientoCreate):
    crecimiento_id: int
    
    class Config:
        from_attributes = True


class Consumo(ConsumoCreate):
    consumo_id: int
    
    class Config:
        from_attributes = True


class Alimentacion(AlimentacionCreate):
    alimentacion_id: int
    
    class Config:
        from_attributes = True


class MedicionAmbiental(MedicionAmbientalCreate):
    medicion_id: int
    
    class Config:
        from_attributes = True


class Mortalidad(MortalidadCreate):
    mortalidad_id: int
    
    class Config:
        from_attributes = True


class MapaTermico(MapaTermicoCreate):
    mapa_id: int
    
    class Config:
        from_attributes = True


# API Response models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[dict] = None