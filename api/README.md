# Poultry Management API

FastAPI backend for the Poultry Management System.

## Setup

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **On macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

6. **Update the .env file with your configuration**

### Running the API

**Development mode:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Or using Python directly:**
```bash
python main.py
```

### API Documentation

Once the server is running, you can access:

- **Interactive API docs (Swagger UI):** http://localhost:8000/docs
- **Alternative API docs (ReDoc):** http://localhost:8000/redoc
- **Health check:** http://localhost:8000/health

## Project Structure

```
api/
├── app/
│   ├── core/           # Core configuration
│   ├── models/         # Data models
│   ├── routers/        # API routes
│   └── services/       # Business logic
├── main.py             # FastAPI application
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Development

### Code Style
The project uses:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting

### Testing
Run tests with:
```bash
pytest
```