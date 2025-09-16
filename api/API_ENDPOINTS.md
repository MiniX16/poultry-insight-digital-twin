# Poultry Management API Endpoints

This document lists all available API endpoints for AWS IoT Core integration and other systems to send data to the poultry management database.

## Base URL
```
http://localhost:8000/api/v1
```

## Available Endpoints

### 1. Health Check
- **GET** `/health` - API health check

### 2. Users (Usuarios)
- **POST** `/api/v1/usuarios/` - Create a new user

### 3. Farms (Granjas)
- **POST** `/api/v1/granjas/` - Create a new farm

### 4. Batches/Lots (Lotes)
- **POST** `/api/v1/lotes/` - Create a new batch/lot

### 5. Individual Chickens (Pollos)
- **POST** `/api/v1/pollos/` - Create a new chicken record

### 6. Growth Data (Crecimiento)
- **POST** `/api/v1/crecimiento/` - Create a new growth measurement

### 7. Consumption Data (Consumo)
- **POST** `/api/v1/consumo/` - Create a new consumption record

### 8. Feeding Data (Alimentacion)
- **POST** `/api/v1/alimentacion/` - Create a new feeding record

### 9. Environmental Measurements (Medicion Ambiental)
- **POST** `/api/v1/medicion-ambiental/` - Create a new environmental measurement

### 10. Mortality Data (Mortalidad)
- **POST** `/api/v1/mortalidad/` - Create a new mortality record

### 11. Thermal Maps (Mapa Termico)
- **POST** `/api/v1/mapa-termico/` - Create a new thermal map

## Data Structures

### Usuario (User)
```json
{
  "nombre": "string",
  "contacto": "string (optional)",
  "telefono": "string (optional)",
  "email": "string",
  "direccion": "string (optional)",
  "contraseña": "string (min 8 chars)"
}
```

### Granja (Farm)
```json
{
  "nombre": "string",
  "capacidad": "integer (> 0)",
  "ubicacion": "string (optional)",
  "usuario_id": "integer (> 0)"
}
```

### Lote (Batch/Lot)
```json
{
  "codigo": "string",
  "fecha_ingreso": "date (YYYY-MM-DD)",
  "cantidad_inicial": "integer (> 0)",
  "raza": "string",
  "granja_id": "integer (> 0)",
  "estado": "activo|inactivo|vendido"
}
```

### Pollo (Individual Chicken)
```json
{
  "lote_id": "integer (> 0)",
  "identificador": "string",
  "peso": "float (> 0, in grams)",
  "estado_salud": "saludable|enfermo|recuperandose",
  "fecha_registro": "datetime (ISO format)"
}
```

### Crecimiento (Growth)
```json
{
  "lote_id": "integer (> 0)",
  "fecha": "date (YYYY-MM-DD)",
  "peso_promedio": "float (> 0, in grams)",
  "ganancia_diaria": "float (optional, >= 0, grams/day)",
  "uniformidad": "float (optional, 0-100%)"
}
```

### Consumo (Consumption)
```json
{
  "lote_id": "integer (> 0)",
  "fecha_hora": "datetime (ISO format)",
  "cantidad_agua": "float (> 0, in liters)",
  "cantidad_alimento": "float (> 0, in kg)",
  "tipo_alimento": "Pre-iniciador|Iniciador|Crecimiento|Finalizador",
  "desperdicio": "float (optional, >= 0, in kg)",
  "kwh": "float (optional, >= 0)"
}
```

### Alimentacion (Feeding)
```json
{
  "lote_id": "integer (> 0)",
  "fecha": "datetime (ISO format)",
  "tipo_alimento": "Pre-iniciador|Iniciador|Crecimiento|Finalizador",
  "cantidad_suministrada": "float (> 0, in kg)",
  "hora_suministro": "string (optional, HH:MM)",
  "responsable": "string"
}
```

### Medicion Ambiental (Environmental Measurement)
```json
{
  "lote_id": "integer (> 0)",
  "fecha_hora": "datetime (ISO format)",
  "temperatura": "float (-50 to 100°C)",
  "humedad": "float (0-100%)",
  "ubicacion": "string (optional)",
  "co2": "float (optional, >= 0 ppm)",
  "amoniaco": "float (optional, >= 0 ppm)",
  "iluminacion": "float (optional, >= 0 lux)",
  "observaciones": "string (optional, max 500 chars)"
}
```

### Mortalidad (Mortality)
```json
{
  "lote_id": "integer (> 0)",
  "fecha": "date (YYYY-MM-DD)",
  "cantidad": "integer (> 0)",
  "causa": "string (optional, max 200 chars)"
}
```

### Mapa Termico (Thermal Map)
```json
{
  "lote_id": "integer (> 0)",
  "fecha": "datetime (ISO format)",
  "temperaturas": [
    [23.5, 24.1, 23.8, ...],
    [23.7, 24.0, 23.9, ...],
    ...
  ]
}
```

## Response Format

All endpoints return a standardized response:

### Success Response
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "id": 123,
    "created_at": "2024-01-01T12:00:00Z",
    ...
  }
}
```

### Error Response
```json
{
  "detail": "Error message describing what went wrong"
}
```

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Notes for AWS IoT Core Integration

1. All endpoints expect JSON payloads
2. Datetime fields should be in ISO format (e.g., "2024-01-01T12:00:00Z")
3. Date fields should be in YYYY-MM-DD format
4. The API includes CORS support for web applications
5. All endpoints return proper HTTP status codes (201 for creation, 500 for errors)