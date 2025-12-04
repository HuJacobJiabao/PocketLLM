# PocketLLM Portal - Architectural Design Document
## Prescriptive Architecture

**Course**: USC CSCI 578 - Software Architecture (Fall 2025)
**Team**: Team #11
**Document Version**: 2.0 (Final Implementation)
**Date**: November 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Style Selection](#2-architectural-style-selection)
3. [Capability Subset Determination](#3-capability-subset-determination)
4. [System Architecture](#4-system-architecture)
5. [UML Diagrams](#5-uml-diagrams)
6. [Technology Stack Rationale](#6-technology-stack-rationale)
7. [Resource Constraints](#7-resource-constraints)
8. [Quality Attributes](#8-quality-attributes)

---

## 1. Executive Summary

### 1.1 System Overview

PocketLLM Portal is a lightweight, production-ready web application designed to provide LLM-powered conversational AI capabilities on resource-constrained, CPU-only hardware. The system targets environments where GPU resources are unavailable or cost-prohibitive, such as edge devices, personal computers, or budget cloud instances.

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Layered + Client-Server Hybrid Architecture** | Separation of concerns while maintaining clear client-server boundaries |
| **Next.js with App Router** | Modern SSR framework with built-in routing, middleware, and BFF pattern support |
| **CPU-Optimized LLM Inference** | llama.cpp with 4-bit quantization enables deployment without GPU requirements |
| **Containerized Deployment** | Docker containers for isolation and reproducibility (not microservices) |
| **Redis-Based Response Caching** | Reduces inference latency for repeated queries within resource constraints |

### 1.3 Resource Constraints

The system is designed to operate within strict resource limits:

- **CPU**: Maximum 4 vCPUs (CPU-only, no GPU)
- **Memory**: Maximum 16 GB RAM
- **Storage**: ~3 GB for application + model
- **Network**: Standard HTTP/WebSocket

---

## 2. Architectural Style Selection

### 2.1 Primary Architecture: Layered Architecture

We selected a **Layered Architecture** as our primary architectural style for the following reasons:

#### Rationale

1. **Clear Separation of Concerns**: Each layer has well-defined responsibilities
   - Presentation Layer (Frontend)
   - Application Layer (Backend Services)
   - Data Layer (Database + Cache)

2. **Maintainability**: Changes to one layer minimally impact others
   - UI changes don't affect business logic
   - Database schema changes isolated from presentation

3. **Testability**: Each layer can be tested independently
   - Frontend components can be unit tested
   - Backend services can be integration tested
   - Mock layers for isolation

4. **Resource Efficiency**: Single-process deployment reduces overhead
   - No inter-service network communication overhead
   - Shared memory space for components
   - Simplified resource allocation

#### Trade-offs Considered

| Architecture Style | Pros | Cons | Decision |
|-------------------|------|------|----------|
| **Layered** | Simple, maintainable, resource-efficient | Less scalable than distributed | ✓ **Selected** - Best fit for resource constraints |
| **Microservices** | Highly scalable, independent deployment | High overhead, complex networking | ✗ Rejected - Exceeds 16GB RAM constraint |
| **Event-Driven** | Asynchronous, decoupled | Complex debugging, eventual consistency | ✗ Rejected - Unnecessary complexity |
| **Monolithic** | Simple deployment | Tight coupling, hard to test | ✗ Rejected - Poor maintainability |

### 2.2 Secondary Pattern: Client-Server

We augment the layered architecture with **Client-Server** pattern:

- **Client**: Next.js frontend (SSR + client-side hydration)
- **Server**: FastAPI backend (REST API + WebSocket)
- **Communication**: HTTP/HTTPS for requests, WebSocket for streaming

This hybrid approach provides:
- Clear network boundary between frontend and backend
- Stateless HTTP for scalability
- WebSocket for real-time streaming responses
- Backend-for-Frontend (BFF) pattern via Next.js API routes

---

## 3. Capability Subset Determination

### 3.1 Original PocketLLM Portal Requirements

Based on the project specification, we identified these potential capabilities:

1. User authentication and authorization
2. Chat interface with LLM
3. Conversation history management
4. Model selection/switching
5. Public API for developers
6. Admin dashboard and monitoring
7. Cache management
8. Error handling and logging
9. Rate limiting
10. Multi-model support

### 3.2 Selected Capability Subset

Given resource constraints (4 vCPUs, 16 GB RAM), we prioritized the following capabilities:

#### Core Capabilities (Implemented ✓)

1. **User Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin/User)
   - Secure password hashing with bcrypt
   - Auto-redirect unauthenticated users to login page
   - **Rationale**: Essential for multi-user system

2. **Chat Interface with LLM**
   - Real-time streaming responses via WebSocket
   - Intelligent context management with token estimation
   - System prompt protection (system prompt always preserved, history auto-truncated when context exceeds)
   - Input field clears immediately after sending for better UX
   - Message persistence
   - **Rationale**: Primary user-facing feature

3. **LLM Inference Engine**
   - TinyLlama-1.1B-Chat (4-bit quantized)
   - CPU-optimized inference via llama.cpp
   - Context window: 2048 tokens
   - Enhanced system prompt with clearer instructions emphasizing accuracy, clarity, and professional tone
   - **Rationale**: Core functionality within resource limits

4. **Response Caching**
   - Redis-based LRU cache (256MB limit)
   - In-memory fallback when Redis unavailable
   - 1-hour TTL for cached responses
   - **Rationale**: Critical for performance within CPU constraints

5. **Conversation History Management**
   - Per-user conversation persistence
   - SQLite database for local storage
   - View and delete past conversations
   - **Rationale**: Expected user feature

6. **Admin Dashboard & Monitoring**
   - System metrics (CPU, memory, uptime)
   - Model information and parameters
   - Cache statistics (hit rate, size)
   - Active session count
   - **Rationale**: Operational visibility

#### Capabilities Deferred/Excluded

7. **Model Selection/Switching** ✗
   - **Reason**: Single model fits within 16GB RAM constraint
   - **Trade-off**: Reduced flexibility for simplified resource management

8. **Public API for Developers** ✗
   - **Reason**: Adds authentication complexity and documentation overhead
   - **Trade-off**: Internal API only, reduces scope

9. **Rate Limiting** ⚠ Partially Implemented
   - **Status**: Configured but not actively enforced
   - **Reason**: Low priority for single-instance deployment
   - **Future Work**: Can be enabled via middleware

10. **Multi-Model Support** ✗
    - **Reason**: Memory overhead of loading multiple models
    - **Trade-off**: Single optimized model within constraints

### 3.3 Capability Prioritization Matrix

| Capability | User Value | Technical Complexity | Resource Cost | Priority |
|------------|------------|---------------------|---------------|----------|
| Authentication | High | Medium | Low | **P0** ✓ |
| Chat Interface | High | High | Medium | **P0** ✓ |
| LLM Inference | High | High | High | **P0** ✓ |
| Response Caching | High | Medium | Low | **P0** ✓ |
| Conversation History | Medium | Low | Low | **P1** ✓ |
| Admin Dashboard | Medium | Medium | Low | **P1** ✓ |
| Model Switching | Medium | High | High | **P2** ✗ |
| Public API | Low | High | Medium | **P3** ✗ |
| Rate Limiting | Low | Low | Low | **P3** ⚠ |

**Legend**: P0 = Must Have, P1 = Should Have, P2 = Nice to Have, P3 = Future

---

## 4. System Architecture

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│                   (React 18 + TypeScript)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket (Port 3000→8000)
┌────────────────────────▼────────────────────────────────────┐
│               FRONTEND LAYER (Next.js 14)                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  App Router (File-Based Routing)                   │     │
│  │  • / (ChatPage)                                    │     │
│  │  • /login (LoginPage)                              │     │
│  │  • /history (HistoryPage)                          │     │
│  │  • /admin (AdminDashboard)                         │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      │                                        │
│  ┌───────────────────▼────────────────────────────────┐     │
│  │  Middleware (Auth Validation & Route Protection)   │     │
│  └───────────────────┬────────────────────────────────┘     │
│                      │                                        │
│  ┌───────────────────▼────────────────────────────────┐     │
│  │  BFF Layer (Next.js API Routes)                    │     │
│  │  • /api/auth/*  → Backend Auth Service            │     │
│  │  • /api/chat/*  → Backend Chat Service (WS)       │     │
│  │  • /api/admin/* → Backend Admin Service           │     │
│  └───────────────────┬────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│            APPLICATION LAYER (FastAPI + Python)              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  API Gateway (FastAPI Router)                    │       │
│  │  • Request validation                            │       │
│  │  • JWT authentication middleware                 │       │
│  │  • Response serialization                        │       │
│  └──────────────┬───────────────────────────────────┘       │
│                 │                                             │
│  ┌──────────────▼──────────────────────────────────┐        │
│  │  Business Logic Services                        │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Auth Service                            │    │        │
│  │  │  • JWT token generation/validation      │    │        │
│  │  │  • Password hashing (bcrypt)            │    │        │
│  │  │  • User session management              │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Session Service                         │    │        │
│  │  │  • Conversation context tracking        │    │        │
│  │  │  • Message history persistence          │    │        │
│  │  │  • Session lifecycle management         │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Model Inference Service                 │    │        │
│  │  │  • Prompt formatting                    │    │        │
│  │  │  • Smart context management with token estimation │    │        │
│  │  │  • System prompt protection (always preserved) │    │        │
│  │  │  • LLM inference orchestration          │    │        │
│  │  │  • Response streaming                   │    │        │
│  │  │  • Cache integration                    │    │        │
│  │  └────────────┬───────────────────────────┘    │        │
│  │               │                                  │        │
│  │  ┌────────────▼───────────────────────────┐    │        │
│  │  │ LLM Engine (llama.cpp)                 │    │        │
│  │  │  • TinyLlama-1.1B-Chat (4-bit GGUF)    │    │        │
│  │  │  • CPU-only inference                  │    │        │
│  │  │  • Streaming token generation          │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Cache Manager                           │    │        │
│  │  │  • Redis client (LRU eviction)          │    │        │
│  │  │  • In-memory fallback                   │    │        │
│  │  │  • Cache key generation                 │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Monitoring Service                      │    │        │
│  │  │  • System metrics collection            │    │        │
│  │  │  • Request counting                     │    │        │
│  │  │  • Performance logging                  │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  └──────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │  SQLite Database     │    │  Redis Cache         │      │
│  │  • User accounts     │    │  • Response cache    │      │
│  │  • Conversations     │    │  • LRU eviction      │      │
│  │  • Messages          │    │  • 256MB limit       │      │
│  │  • Sessions          │    │  • 1-hour TTL        │      │
│  └──────────────────────┘    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Layer Responsibilities

#### Frontend Layer (Presentation)
- **Technology**: Next.js 14 + React 18 + TypeScript
- **Responsibilities**:
  - User interface rendering (SSR + client-side hydration)
  - Client-side state management (React Context API)
  - Form validation and user input handling
  - Input field clears immediately after sending for better UX
  - WebSocket client for streaming responses
  - Backend-for-Frontend (BFF) API routes
  - Middleware-based authentication and route protection (auto-redirect to login)

#### Application Layer (Business Logic)
- **Technology**: FastAPI + Python 3.11
- **Responsibilities**:
  - Authentication and authorization (JWT)
  - LLM inference orchestration
  - Intelligent context management with token estimation
  - System prompt protection (always preserved, history auto-truncated)
  - Response caching logic
  - Session and conversation management
  - System monitoring and telemetry

#### Data Layer (Persistence)
- **Technology**: SQLite + Redis
- **Responsibilities**:
  - Persistent storage (SQLite)
    - User accounts and credentials
    - Conversation history
    - Session metadata
  - Temporary caching (Redis)
    - LLM response cache
    - Session state
    - Rate limiting counters (future)

### 4.3 Communication Patterns

1. **Frontend ↔ Backend**
   - **Protocol**: HTTP/HTTPS (REST) + WebSocket
   - **Format**: JSON
   - **Authentication**: JWT Bearer tokens

2. **Application ↔ Data**
   - **SQLite**: Direct file I/O via SQLAlchemy ORM
   - **Redis**: TCP connection via redis-py client

3. **Within Application Layer**
   - **Pattern**: Dependency injection
   - **Coupling**: Loose coupling via interfaces (Python protocols)

---

## 5. UML Diagrams

### 5.1 Use Case Diagram

**Diagram Type**: UML Use Case Diagram

![5.1 Use Case Diagram](HW3/diagrams/svg/use-case.svg)

**Actors**:
- **User**: Regular user who interacts with the chat interface
- **Admin**: Administrator with access to system monitoring and cache management

**Use Cases**:
1. **Authenticate**: Login with username/password, receive JWT token
2. **Chat with LLM**: Send prompts and receive streaming responses
3. **View Conversation History**: Browse past conversations
4. **Manage Sessions**: Create, view, and delete conversation sessions
5. **Monitor System**: View system metrics (CPU, memory, uptime)
6. **View Cache Statistics**: Check cache hit rate and size
7. **Handle Errors**: Error handling and user feedback

### 5.2 Class Diagram (Backend)

**Diagram Type**: UML Class Diagram

![5.2 Class Diagram (Backend)](HW3/diagrams/svg/class.svg)

**Key Classes**:

1. **AuthService**: Handles authentication, JWT tokens, password hashing
2. **SessionService**: Manages conversation sessions and message history
3. **ModelInferenceService**: Orchestrates LLM inference with caching
4. **LLMEngine**: Wraps llama.cpp for direct model inference
5. **CacheManager**: Manages Redis cache with in-memory fallback
6. **MonitoringService**: Collects system metrics and statistics
7. **AdminService**: Provides admin functionality (metrics, cache flush)

### 5.3 Component Diagram

**Diagram Type**: UML Component Diagram

![5.3 Component Diagram](HW3/diagrams/svg/component.svg)

**Components**:

**Frontend**:
- **App Router**: Next.js file-based routing
- **Middleware**: Authentication and route protection
- **Pages**: Chat, History, Admin interfaces
- **BFF API Routes**: Backend-for-Frontend layer
- **Clients**: WebSocket for streaming, Fetch for REST

**Backend**:
- **API Gateway**: FastAPI router and middleware
- **Services**: Business logic (Auth, Session, Inference, Cache, Monitoring, Admin)
- **LLM Engine**: llama.cpp wrapper for CPU inference

**Data Layer**:
- **SQLite**: Persistent storage for users, sessions, messages
- **Redis**: Temporary cache for LLM responses

### 5.4 Sequence Diagram: Chat with Streaming

**Diagram Type**: UML Sequence Diagram

![5.4 Sequence Diagram: Chat with Streaming](HW3/diagrams/svg/sequence-chat.svg)

**Flow Description**:

1. User enters prompt in chat interface
2. WebSocket client sends message to Next.js BFF
3. BFF validates JWT and forwards to FastAPI backend
4. Backend validates session and formats prompt
5. Inference service checks cache (miss in this case)
6. LLM engine generates response token-by-token
7. Each token streams back through the chain to the UI
8. Complete response is cached and saved to database
9. User sees streaming response in real-time

### 5.5 Deployment Diagram

**Diagram Type**: UML Deployment Diagram

![5.5 Deployment Diagram](HW3/diagrams/svg/deployment.svg)

**Deployment Characteristics**:

1. **Containerization Strategy**:
   - Three containers representing three layers (Frontend, Application, Data)
   - Docker Compose for orchestration (not Kubernetes)
   - Single Docker network for inter-container communication

2. **Resource Allocation**:
   - **Frontend**: 1.0 CPU, 1.5 GB RAM (Next.js SSR)
   - **Backend**: 2.5 CPU, 14 GB RAM (LLM inference + services)
   - **Redis**: 0.5 CPU, 512 MB RAM (cache only)
   - **Total**: Exactly 4.0 vCPUs, 16 GB RAM ✓

3. **Data Persistence**:
   - **SQLite**: Persisted via Docker volume `backend-data`
   - **Model**: Embedded in backend Docker image (immutable)
   - **Redis**: Ephemeral (cache can be rebuilt)

4. **Network Configuration**:
   - Frontend exposes port 3000 to host
   - Backend exposes port 8000 to host
   - Redis only accessible within Docker network
   - WebSocket support on same ports as HTTP

### 5.6 Sequence Diagram: Admin Cache Flush

**Diagram Type**: UML Sequence Diagram

![5.6 Sequence Diagram: Admin Cache Flush](HW3/diagrams/svg/sequence-admin.svg)

**Flow Description**:

1. Admin clicks "Flush Cache" button
2. Frontend sends request with JWT token
3. Next.js BFF validates JWT and admin role
4. FastAPI gateway re-validates token (defense in depth)
5. Admin service delegates to cache manager
6. Cache manager flushes Redis (or memory cache if Redis unavailable)
7. Monitoring service logs admin action
8. Success response propagates back to UI
9. Admin sees confirmation notification

---

## 6. Technology Stack Rationale

### 6.1 Frontend: Next.js 14 + React 18

**Selection Rationale**:

| Criterion | Evaluation |
|-----------|------------|
| **Server-Side Rendering (SSR)** | Essential for SEO and initial load performance |
| **App Router** | Modern file-based routing, built-in middleware |
| **Backend-for-Frontend (BFF)** | API routes enable clean separation of concerns |
| **TypeScript Support** | Type safety for large-scale application |
| **Performance** | Automatic code splitting, image optimization |

**Alternatives Considered**:
- ✗ **Create React App**: Client-side only, no SSR
- ✗ **Vite + React**: No built-in SSR, would require custom setup
- ✓ **Next.js**: Best fit for all requirements

### 6.2 Backend: FastAPI + Python 3.11

**Selection Rationale**:

| Criterion | Evaluation |
|-----------|------------|
| **Performance** | Async support, comparable to Node.js |
| **LLM Integration** | Excellent Python ecosystem (llama-cpp-python) |
| **Type Safety** | Pydantic models for request/response validation |
| **Documentation** | Auto-generated OpenAPI/Swagger docs |
| **WebSocket Support** | Built-in WebSocket support for streaming |

**Alternatives Considered**:
- ✗ **Django**: Too heavyweight, not async-first
- ✗ **Flask**: Less modern, no automatic validation
- ✓ **FastAPI**: Best fit for LLM + async + performance

### 6.3 LLM Inference: llama.cpp + TinyLlama

**Selection Rationale**:

| Criterion | TinyLlama-1.1B-Chat | Alternatives |
|-----------|---------------------|--------------|
| **Model Size** | 638 MB (4-bit quantized) | Llama-2-7B: 3.5 GB (too large) |
| **Memory Footprint** | ~2-4 GB during inference | Llama-2: 8-12 GB (exceeds limit) |
| **CPU Performance** | 5-10 tokens/sec on CPU | Larger models: 1-2 tokens/sec |
| **Quality** | Good for simple chat | Better quality but unusable on CPU |

**Why llama.cpp?**:
- CPU-optimized inference engine (no GPU required)
- 4-bit quantization support (Q4_K_M)
- Streaming token generation
- Low memory overhead
- C++ core with Python bindings

**Alternatives Considered**:
- ✗ **Hugging Face Transformers**: Too slow on CPU, high memory usage
- ✗ **GGML (deprecated)**: Predecessor to llama.cpp
- ✓ **llama.cpp**: Best CPU performance

### 6.4 Database: SQLite

**Selection Rationale**:

| Criterion | Evaluation |
|-----------|------------|
| **Deployment** | Single file, no external server required |
| **Performance** | Fast for read-heavy workloads (chat history) |
| **Resource Usage** | Minimal overhead |
| **Transactions** | ACID compliance for data integrity |

**Alternatives Considered**:
- ✗ **PostgreSQL**: Overkill for single-instance deployment
- ✗ **MySQL**: Additional container overhead
- ✓ **SQLite**: Perfect for embedded use case

### 6.5 Cache: Redis

**Selection Rationale**:

| Criterion | Evaluation |
|-----------|------------|
| **LRU Eviction** | Built-in LRU policy for cache management |
| **Performance** | In-memory, microsecond latency |
| **Simplicity** | Key-value store, easy to use |
| **Docker Support** | Official Alpine image (40 MB) |

**Alternatives Considered**:
- ✗ **Memcached**: Less feature-rich than Redis
- ✗ **In-memory only**: No persistence across restarts
- ✓ **Redis**: Industry standard for caching

**Fallback Strategy**:
- **Primary**: Redis cache
- **Fallback**: In-memory Python dictionary (if Redis unavailable)
- **Rationale**: High availability even if Redis fails

---

## 7. Resource Constraints

### 7.1 Resource Allocation Strategy

| Component | CPU Limit | Memory Limit | Rationale |
|-----------|-----------|--------------|-----------|
| **Frontend** | 1.0 core | 1.5 GB | Next.js SSR + static assets |
| **Backend** | 2.5 cores | 14 GB | LLM inference (memory-intensive) |
| **Redis** | 0.5 cores | 512 MB | Cache only (limited dataset) |
| **Total** | **4.0 cores** | **16.0 GB** | ✓ Exactly at project limits |

### 7.2 Optimization Techniques

1. **Model Quantization**
   - 4-bit quantization reduces model size from 2.2 GB → 638 MB
   - Minimal quality degradation for chat tasks
   - Enables fitting within 16 GB RAM constraint

2. **Response Caching**
   - Redis LRU cache with 256 MB limit
   - 1-hour TTL balances freshness and hit rate
   - Reduces CPU usage for repeated queries

3. **Context Window Management**
   - 2048 token context window (not full 4096)
   - Smart truncation that always preserves system prompt, truncates history instead
   - Token estimation for intelligent context management
   - Reduces memory usage during inference
   - Sufficient for most chat conversations

4. **Streaming Responses**
   - WebSocket-based token streaming
   - Reduces perceived latency
   - Lower memory buffering requirements

5. **Docker Multi-Stage Builds**
   - Frontend: 224 MB final image (from 1.5 GB build)
   - Backend: 1.99 GB final image (includes 638 MB model)
   - Optimized layer caching for fast rebuilds

### 7.3 Resource Monitoring

**Admin Dashboard Metrics**:
- CPU usage percentage
- Memory usage percentage
- System uptime
- Active session count
- Cache hit rate
- Model inference latency

**Alerts** (Future Work):
- CPU > 90% for 5 minutes
- Memory > 95%
- Cache hit rate < 20%

---

## 8. Quality Attributes

### 8.1 Performance

**Requirements**:
- Chat response time: < 10 seconds (first token)
- Streaming latency: < 100ms (per token)
- Concurrent users: 5-10 simultaneous

**Strategies**:
- Response caching (Redis LRU)
- Streaming inference (WebSocket)
- CPU-optimized inference engine (llama.cpp)
- Context window trimming

### 8.2 Scalability

**Vertical Scaling** (Primary Strategy):
- Increase CPU cores for faster inference
- Increase RAM for larger models
- Current: 4 vCPUs, 16 GB RAM
- Future: 8 vCPUs, 32 GB RAM for larger models

**Horizontal Scaling** (Future Work):
- Load balancer in front of multiple frontend containers
- Shared Redis cache across backend instances
- Shared SQLite → PostgreSQL for multi-writer

**Limitations**:
- SQLite not designed for multi-writer scenarios
- Single LLM model instance per backend container
- Not architected for microservices-style scaling

### 8.3 Availability

**Target**: 99% uptime (excluding planned maintenance)

**Strategies**:
- Docker health checks with automatic restart
- Graceful degradation (Redis fallback to in-memory)
- Error handling with user-friendly messages
- Database persistence via Docker volumes

**Single Points of Failure**:
- ⚠ Single backend container (LLM inference)
- ⚠ Single SQLite database file
- ✓ Redis cache (has fallback)

**Mitigation**:
- Docker restart policy: `unless-stopped`
- Regular database backups (future work)
- Monitoring and alerts

### 8.4 Security

**Authentication**:
- JWT-based authentication
- bcrypt password hashing (cost factor: 12)
- Token expiration: 30 minutes
- Secure token storage (HTTP-only cookies in production)
- Auto-redirect unauthenticated users to login page (middleware-based route protection)

**Authorization**:
- Role-based access control (Admin/User)
- Middleware-based route protection
- Admin endpoints require `is_admin=true` in JWT

**Data Protection**:
- HTTPS/WSS in production (not in dev)
- SQL injection prevention via ORM (SQLAlchemy)
- Input validation via Pydantic models

**Future Enhancements**:
- Rate limiting (configured but not enforced)
- CORS policy enforcement
- Content Security Policy (CSP) headers

### 8.5 Maintainability

**Code Organization**:
- Layered architecture with clear separation
- Dependency injection for loose coupling
- Type hints throughout (Python + TypeScript)

**Documentation**:
- Inline code comments for complex logic
- README.md with deployment instructions
- OpenAPI/Swagger docs for API
- UML diagrams for architecture

**Testing** (Future Work):
- Unit tests for services
- Integration tests for API endpoints
- End-to-end tests for critical flows

### 8.6 Usability

**User Experience**:
- Real-time streaming responses (no loading spinner)
- Conversation history for context
- Error messages with recovery suggestions
- Responsive design (mobile + desktop)

**Admin Experience**:
- Dashboard with system metrics
- One-click cache flush
- Model configuration visibility

---

## Conclusion

This prescriptive architecture document defines the **intended design** of PocketLLM Portal. The system implements a **Layered + Client-Server hybrid architecture** optimized for CPU-only, resource-constrained deployment.

**Key Architectural Strengths**:
1. ✓ Clear separation of concerns via layered architecture
2. ✓ Resource-efficient design (exactly 4 vCPUs, 16 GB RAM)
3. ✓ CPU-optimized LLM inference with 4-bit quantization
4. ✓ Response caching for performance within constraints
5. ✓ Containerized deployment for reproducibility

**Scope Management**:
- Implemented core capabilities (chat, auth, history, caching, admin)
- Deferred advanced features (model switching, public API, rate limiting)
- Prioritized resource efficiency over feature breadth

The next document (**IMPLEMENTATION_DEPARTURES.md**) will describe any deviations from this prescriptive architecture that occurred during implementation.
