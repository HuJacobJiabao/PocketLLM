# PocketLLM Portal

A lightweight, production-ready web application for LLM-powered conversational AI running on resource-constrained, CPU-only hardware. Built as a team project for USC CSCI 578 - Software Architecture (Fall 2025).

## Overview

PocketLLM Portal provides a scalable, containerized architecture for deploying large language models in environments where GPU resources are unavailable or cost-prohibitive. The system leverages efficient quantization techniques and CPU-optimized inference to deliver responsive chat capabilities within strict resource constraints.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Team](#team)
- [License](#license)

## Architecture

This project implements a **Layered + Client-Server hybrid architecture** as designed in HW2 and HW3:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────────┐
│              Frontend (Next.js 14 + React 18)                │
│  • Server-Side Rendering (SSR)                               │
│  • Backend-for-Frontend (BFF) API Routes                     │
│  • Context API State Management                              │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│              Backend (FastAPI + Python)                      │
│  • Authentication Service (JWT)                              │
│  • LLM Inference Engine (llama.cpp)                         │
│  • Response Cache Manager (Redis)                            │
│  • SQLite Database (User + History)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Redis Cache (Optional)                        │
│  • LRU Cache Policy (256MB limit)                           │
│  • TTL: 1 hour                                               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Compliance

Built following the **Layered + Client-Server hybrid architecture** from CSCI 578 HW2/HW3:

**Layered Architecture:**
- **Frontend Layer** (Next.js): User interaction and visualization
- **Application Layer** (FastAPI): Authentication, caching, inference orchestration, monitoring
- **Data Layer** (SQLite + Redis): Persistent user data and cache

**Key Architectural Decisions:**
- **Next.js App Router**: Modern file-based routing with SSR
- **Backend-for-Frontend (BFF) Pattern**: Next.js API routes abstract backend complexity
- **Containerized Deployment**: Docker containers for deployment isolation (not microservices)
- **CPU-Optimized Inference**: llama.cpp with 3-bit quantization for Llama-3-8B model

### Resource Constraints

Designed to run within strict resource limits:

- **CPU-only** (no GPU required)
- **4 vCPUs maximum**
- **16 GB RAM maximum**
- **Docker Deployment**: Fully containerized, production-ready

**Actual Resource Allocation:**

| Service  | CPU Limit | Memory Limit | Notes                          |
|----------|-----------|--------------|--------------------------------|
| Backend  | 2.5 cores | 14 GB        | LLM inference + API services   |
| Frontend | 1.0 core  | 1.5 GB       | Next.js SSR + static assets    |
| Redis    | 0.5 cores | 512 MB       | Response caching (optional)    |
| **Total**| **4.0**   | **16 GB**    | Exactly at project limits ✅   |

## Features

### Core Features (Implemented ✅)

- **User Authentication**
  - JWT-based authentication with secure token handling
  - Role-based access control (Admin/User)
  - Session management with automatic token refresh
  - Auto-redirect unauthenticated users to login page

- **Chat Interface**
  - Real-time streaming responses (WebSocket)
  - Intelligent context management with token estimation
  - System prompt protection (system prompt always preserved, history auto-truncated when context exceeds)
  - Input field clears immediately after sending for better UX
  - Message history persistence

- **LLM Inference**
  - Meta-Llama-3-8B-Instruct (3-bit quantized, ~3.5GB model)
  - CPU-optimized inference via llama.cpp
  - Temperature: 0.0, Top-P: 1.0, Max Tokens: 1024, Context: 4096
  - Enhanced system prompt with clearer instructions emphasizing accuracy, clarity, and professional tone

- **Response Caching**
  - Redis-based LRU cache (256MB limit)
  - In-memory fallback when Redis unavailable
  - 1-hour TTL for cached responses

- **Conversation History**
  - Per-user conversation persistence
  - SQLite database for fast local storage
  - View and manage past conversations

### Admin Features (Implemented ✅)

- **Admin Dashboard**
  - System metrics (CPU, memory, uptime)
  - Model information (loaded model, parameters)
  - Active sessions count
  - Cache statistics (hit rate, size)

- **Monitoring & Telemetry**
  - Real-time system resource monitoring
  - LLM inference performance metrics
  - Cache hit/miss statistics

### Optional Features (Partially Implemented ⭕)

- **WebSocket Support**: Implemented for streaming responses
- **Model Management**: Basic model loading and configuration
- **Rate Limiting**: Configured but not actively enforced

## Technology Stack

### Frontend
- **Framework**: Next.js 14.2+ (React 18+, App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom design)
- **State Management**: React Context API
- **HTTP Client**: Fetch API / WebSocket

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite 3
- **Cache**: Redis 7
- **Authentication**: python-jose (JWT), passlib (bcrypt)

### LLM Inference
- **Model**: Meta-Llama-3-8B-Instruct (3-bit quantized GGUF)
- **Model Size**: ~3.5 GB
- **Inference Engine**: llama-cpp-python 0.3.2+
- **Quantization**: Q3_K_M (3-bit mixed quantization)
- **Context Window**: 4096 tokens
- **Inference Threads**: 4 (configurable via environment)

### Deployment
- **Containerization**: Docker 20.10+
- **Orchestration**: Docker Compose 2.0+
- **Base Images**:
  - Frontend: `node:20-alpine` (~224 MB final image)
  - Backend: `python:3.11-slim` (~4.5 GB with Llama-3-8B model)
  - Cache: `redis:7-alpine`

## Quick Start

Choose your preferred deployment method:

### Option 1: Docker Deployment (Recommended)

**Best for**: Production deployment, testing, and quick setup

**Prerequisites:**
- Docker 20.10+ with Docker Compose
- 4 vCPUs, 16 GB RAM minimum
- Linux, macOS, or Windows with WSL2

**Steps:**

```bash
# 1. Clone the repository
git clone <repository-url>
cd PocketLLM

# 2. Build and start all services (Docker will auto-download the model)
docker-compose up -d --build

# 3. Monitor logs (first build takes ~15-20 minutes)
docker-compose logs -f backend
```

**What happens during build:**
- Frontend and backend Docker images are built
- **Meta-Llama-3-8B-Instruct** model (~3.5GB) is automatically downloaded during backend build
- All dependencies are installed and services start

**Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Default credentials:**
- Admin: `admin` / `admin123`
- User: `user` / `user123`

**Model information (Docker):**
- **Name**: Meta-Llama-3-8B-Instruct
- **Size**: ~3.5 GB
- **Quantization**: Q3_K_M (3-bit mixed)
- **Source**: [QuantFactory/Meta-Llama-3-8B-Instruct-GGUF](https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF)
- **Location**: Embedded in Docker image at `/app/models/model.gguf`

---

### Option 2: Local Development Setup

**Best for**: Development, debugging, and customization

**Prerequisites:**
- Node.js 18+ and npm
- Python 3.11+
- Redis (optional - backend will use in-memory cache if unavailable)
- ~4 GB free disk space for LLM model

**Steps:**

**1. Clone the repository**
```bash
git clone <repository-url>
cd PocketLLM
```

**2. Download a model** (choose one based on your system)

```bash
# Option A: Llama-3-8B (same as Docker, ~3.5GB, better quality)
mkdir -p models
curl -L "https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct.Q3_K_M.gguf" \
  -o models/model.gguf

# Option B: Smaller model for testing (use any GGUF model)
# You can use any compatible GGUF model file
```

**3. Setup Backend** (Terminal 1)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
ENVIRONMENT=development
DEBUG=true
MODEL_PATH=../models/model.gguf
MODEL_N_CTX=4096
MODEL_N_THREADS=4
MODEL_TEMPERATURE=0.0
MODEL_MAX_TOKENS=1024
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=sqlite:///./pocketllm.db
SECRET_KEY=dev-secret-key-change-in-production
EOF

# Run development server
python main.py
```

Backend will be available at http://localhost:8000

**4. Setup Frontend** (Terminal 2)
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

**5. Optional: Start Redis** (Terminal 3)
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# OR install Redis locally and run
redis-server
```

**Note**: Redis is optional. The backend will automatically fall back to in-memory caching if Redis is unavailable.

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## Docker Deployment

### Deployment Architecture

The Docker deployment uses **containerization for isolation**, not a microservices architecture. We deploy three containers representing our layered architecture:

1. **Frontend Container** (Frontend Layer - Next.js standalone mode)
   - Port: 3000
   - Health check: `/api/health`
   - Build time: ~2-3 minutes
   - Includes BFF layer (Next.js API routes)

2. **Backend Container** (Application Layer - FastAPI + embedded model)
   - Port: 8000
   - Health check: `/health`
   - Build time: ~10-15 minutes (first time)
   - Model: Embedded in image (no external mount)
   - Services: Authentication, LLM inference, monitoring

3. **Redis Container** (Data Layer - Cache)
   - Port: 6379
   - LRU eviction policy
   - 256MB memory limit


### Deployment Commands

```bash
# Build images (required first time)
docker-compose build

# Start all services
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Using the Deployment Script

We provide a convenient deployment script for common operations:

```bash
# Build images
./docker/deploy.sh build

# Start services
./docker/deploy.sh up

# Stop services
./docker/deploy.sh down

# Restart services
./docker/deploy.sh restart

# View logs
./docker/deploy.sh logs

# Check status
./docker/deploy.sh status

# Clean up (remove containers, volumes, images)
./docker/deploy.sh clean
```

### Health Checks

All services implement Docker health checks:

```bash
# Check all services
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Test frontend health
curl http://localhost:3000/api/health

# Expected output: {"status":"healthy",...}
```

### Data Persistence

- **Database**: SQLite database persists in named volume `backend-data`
- **Model**: Embedded in Docker image (1.99 GB total image size)
- **Cache**: Redis data is ephemeral (intentional for cache)

**Important**: User data and conversation history survive container restarts via the `backend-data` volume.

### Resource Monitoring

```bash
# Real-time resource usage
docker stats

# Service-specific stats
docker stats pocketllm-backend-1 pocketllm-frontend-1
```

For detailed Docker deployment instructions, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

> **Note**: For local development setup, see [Option 2: Local Development Setup](#option-2-local-development-setup) in the Quick Start section above.

## Project Structure

```
PocketLLM/
├── frontend/                # Next.js application
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Chat interface (/)
│   │   ├── login/          # Login page
│   │   ├── history/        # Conversation history
│   │   ├── admin/          # Admin dashboard
│   │   └── api/            # BFF API routes
│   ├── components/         # Reusable React components
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ChatContext.tsx # Chat state management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and helpers
│   └── public/             # Static assets
│
├── backend/                # Python backend
│   ├── main.py            # FastAPI application entry
│   ├── config.py          # Configuration management
│   ├── models.py          # SQLAlchemy models
│   ├── database.py        # Database connection
│   ├── auth/              # Authentication logic
│   │   ├── jwt_handler.py # JWT token management
│   │   └── password.py    # Password hashing
│   ├── services/          # Business logic services
│   │   ├── cache_service.py    # Redis cache manager
│   │   ├── llm_service.py      # LLM inference
│   │   └── monitoring_service.py # System metrics
│   ├── routes/            # API endpoints
│   │   ├── auth.py        # Authentication routes
│   │   ├── chat.py        # Chat endpoints
│   │   ├── history.py     # History management
│   │   └── admin.py       # Admin routes
│   └── requirements.txt   # Python dependencies
│
├── docker/                # Docker configurations
│   ├── Dockerfile.backend # Backend multi-stage build
│   ├── Dockerfile.frontend# Frontend multi-stage build
│   └── deploy.sh          # Deployment automation script
│
├── models/                # LLM model files (not in Git, for local dev only)
│   └── model.gguf         # User-provided GGUF model (~3.5GB for Llama-3-8B)
│
├── docker-compose.yml     # Service orchestration
├── .dockerignore          # Docker build exclusions
├── .gitignore             # Git exclusions
├── README.md              # This file
└── DOCKER_DEPLOYMENT.md   # Detailed deployment guide
```

## API Documentation

### Authentication

**POST** `/auth/login`
```json
Request:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user_id": "uuid",
  "username": "admin",
  "is_admin": true
}
```

### Chat

**POST** `/chat`
```json
Request:
{
  "message": "Hello, how are you?",
  "conversation_id": "optional-uuid"
}

Response:
{
  "response": "I'm doing well, thank you! How can I help you?",
  "conversation_id": "uuid",
  "timestamp": "2025-11-16T07:30:00Z"
}
```

**WebSocket** `/chat/stream`
```
Connect: ws://localhost:8000/chat/stream?token=<jwt-token>
Send: {"message": "Tell me a story", "conversation_id": "uuid"}
Receive: {"chunk": "Once ", "done": false}
Receive: {"chunk": "upon ", "done": false}
...
Receive: {"chunk": "", "done": true}
```

### Admin

**GET** `/admin/metrics` (Admin only)
```json
Response:
{
  "cpu_percent": 45.2,
  "memory_percent": 62.8,
  "uptime_seconds": 3600,
  "active_sessions": 5
}
```

**GET** `/admin/model/info` (Admin only)
```json
Response:
{
  "model_path": "/app/models/model.gguf",
  "model_loaded": true,
  "context_length": 4096,
  "parameters": {
    "temperature": 0.0,
    "top_p": 1.0,
    "max_tokens": 1024
  }
}
```

For interactive API documentation, visit http://localhost:8000/docs (Swagger UI) when the backend is running.

## Configuration

### Backend Configuration

All backend settings are in [`backend/config.py`](backend/config.py) and can be overridden via environment variables:

```python
# LLM Model Settings
MODEL_PATH: str = "/app/models/model.gguf"  # Docker path
MODEL_N_CTX: int = 4096          # Context window
MODEL_N_THREADS: int = 4         # Inference threads
MODEL_TEMPERATURE: float = 0.0   # Sampling temperature
MODEL_TOP_P: float = 1.0         # Nucleus sampling
MODEL_MAX_TOKENS: int = 1024     # Max response tokens

# Redis Cache Settings
REDIS_HOST: str = "localhost"    # Docker: "redis"
REDIS_PORT: int = 6379
CACHE_TTL_SECONDS: int = 3600    # 1 hour
ENABLE_CACHE: bool = True

# Security Settings
SECRET_KEY: str = "change-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
```

### Frontend Configuration

Frontend settings are in [`frontend/next.config.js`](frontend/next.config.js):

```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Required for Docker deployment
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
}
```

## Testing

### Manual Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test chat (with token from login)
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is 2+2?","conversation_id":"test-123"}'

# Test frontend
curl http://localhost:3000/api/health
```

### Health Check Endpoints

- **Backend**: http://localhost:8000/health
- **Frontend**: http://localhost:3000/api/health

Expected response: `{"status":"healthy",...}`

## Team

USC CSCI 578 - Software Architecture - Fall 2025

- Hu, Jiabao
- Ji, Samuel
- Santosa, Gregory
- Yang, Yifei
- Zhang, Aiyu
- Zhu, Ning

## License

This project is part of USC CSCI 578 Team Project (Fall 2025).

Academic Use Only - Not for Commercial Distribution

---

## Additional Resources

- **Docker Deployment Guide**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- **Architecture Compliance Report**: [ARCHITECTURE_COMPLIANCE.md](./ARCHITECTURE_COMPLIANCE.md)

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3000/8000
   lsof -i :3000
   lsof -i :8000

   # Kill the process or change ports in docker-compose.yml
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache and rebuild
   docker system prune -a
   docker-compose build --no-cache
   ```

3. **Model File Not Found**
   - The model is embedded in the Docker image (auto-downloaded during build)
   - Verify: `docker-compose exec backend ls -lh /app/models/`
   - Expected: `~3.5G model.gguf` (Meta-Llama-3-8B-Instruct)

4. **Redis Connection Failed**
   - Backend will fall back to in-memory cache
   - Check logs: `docker-compose logs backend | grep Redis`
   - Should see: `✓ Redis cache enabled`

For more detailed troubleshooting, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#troubleshooting).

## Support

For issues or questions:
- Review the [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) guide
- Check service logs: `docker-compose logs -f`
- Contact the development team

---

**Built with ❤️ for USC CSCI 578 - Software Architecture**
