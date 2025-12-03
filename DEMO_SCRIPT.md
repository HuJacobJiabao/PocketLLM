# PocketLLM Portal - 5-Minute Demo Video Script

**Total Duration: ~5 minutes**

---

## SECTION 1: Introduction (30 seconds)

**[Screen: PocketLLM Portal homepage]**

**Narrator:**
> "Hello! We're presenting PocketLLM Portal, a production-ready LLM chat application designed for USC CSCI 578 Software Architecture. Our team built this system to run efficiently on resource-constrained, CPU-only hardware - no GPU required."

**[Screen: Show team members]**
> "Team members: Jiabao Hu, Samuel Ji, Gregory Santosa, Yifei Yang, Aiyu Zhang, and Ning Zhu."

**Key Points:**
- ✓ CPU-only inference
- ✓ 4 vCPUs, 16GB RAM constraint
- ✓ Layered + Client-Server architecture

---

## SECTION 2: Architectural Overview (45 seconds)

**[Screen: Architecture diagram from ARCHITECTURE_DESIGN.md]**

**Narrator:**
> "Our architecture follows a **Layered + Client-Server hybrid** pattern with three distinct layers."

**[Point to diagram layers]**

**Frontend Layer:**
> "The Frontend Layer uses Next.js 14 with Server-Side Rendering, implementing the Backend-for-Frontend pattern. This means our Next.js API routes act as an abstraction layer between the UI and backend services."

**Application Layer:**
> "The Application Layer runs on FastAPI and Python, handling authentication via JWT, LLM inference orchestration using llama.cpp, and intelligent caching with Redis fallback to in-memory."

**Data Layer:**
> "The Data Layer combines SQLite for persistent storage of users and conversations, and Redis for LRU caching of LLM responses with 1-hour TTL."

**Key Architectural Strength:**
> "A major strength is our **containerized deployment** - not microservices, but isolated containers representing each layer. This provides deployment flexibility while maintaining architectural simplicity."

---

## SECTION 3: Live Application Demo (1 minute 30 seconds)

### 3.1 Authentication (15 seconds)

**[Screen: Login page]**

**Narrator:**
> "Let's start with user authentication. We support role-based access control."

**[Action: Login as regular user]**
- Username: `user`
- Password: `user123`

> "Regular users can access the chat interface and view their conversation history."

### 3.2 Chat Interface - Core Feature (30 seconds)

**[Screen: Chat page]**

**Narrator:**
> "Here's our main feature - the AI chat interface. We're using **Meta-Llama-3-8B-Instruct**, a 3-bit quantized model (~3.5GB) running entirely on CPU."

**[Action: Type a question]**
- Example: "Explain the concept of software architecture in one paragraph."

**[Show streaming response]**

**Narrator:**
> "Notice the **real-time streaming** - we use Server-Sent Events instead of WebSockets for better reliability. This was one of our architectural departures from the original design."

**Key Technical Highlight:**
> "Behind the scenes, our system checks the Redis cache first. If the exact prompt with context exists, we return cached results instantly. Otherwise, we perform fresh inference and cache it for future requests."

### 3.3 Conversation History (15 seconds)

**[Screen: Navigate to History page]**

**Narrator:**
> "Users can view their complete conversation history. All messages are persisted in SQLite, ensuring data survives container restarts."

**[Action: Show previous conversations, click one to view]**

### 3.4 Admin Dashboard (30 seconds)

**[Screen: Logout and login as admin]**
- Username: `admin`
- Password: `admin123`

**[Screen: Admin dashboard]**

**Narrator:**
> "Admin users have access to the monitoring dashboard. Here we can see:"

**[Point to metrics]**
- System metrics: CPU usage, memory consumption, uptime
- Active sessions count
- Cache statistics: hit rate, cache size
- Model information: loaded model, parameters, context length

**[Action: Show cache flush functionality]**

> "Admins can manually flush the Redis cache when needed."

---

## SECTION 4: Architectural Strengths (45 seconds)

**[Screen: Split screen showing code + architecture diagram]**

**Narrator:**
> "Let me highlight our key architectural strengths:"

**1. Resource Efficiency (15 seconds)**
> "First, **resource efficiency**. We fit a production LLM application within 4 vCPUs and 16GB RAM using 3-bit quantization and CPU-optimized inference. Our Docker deployment shows backend using ~3.5 vCPUs and 12GB during peak inference."

**[Screen: Show docker stats output]**

**2. Intelligent Caching Strategy (15 seconds)**
> "Second, **intelligent caching**. Our context-aware cache keys include user ID, session ID, and full conversation context - not just the prompt. This dramatically improves cache hit rates in multi-turn conversations."

**[Screen: Show cache_service.py code snippet]**

**3. Graceful Degradation (15 seconds)**
> "Third, **graceful degradation**. If Redis fails, we automatically fall back to in-memory caching. The application never crashes due to cache unavailability."

**[Screen: Show fallback logic in code]**

---

## SECTION 5: Implementation Departures (30 seconds)

**[Screen: IMPLEMENTATION_DEPARTURES.md document]**

**Narrator:**
> "During implementation, we made six strategic departures from our original design:"

**[Show list quickly]**

1. **Prompt Formatting**: Switched from ChatML to Llama format for model compatibility
2. **History Trimming**: Simplified from token-based to fixed message count (5 messages for streaming)
3. **Cache Key Strategy**: Enhanced with full conversation context
4. **Streaming Protocol**: Server-Sent Events instead of WebSocket for better Next.js integration
5. **Model Deployment**: Embedded in Docker image (~3.5GB download during build)
6. **Configuration**: Direct environment variables instead of Pydantic Settings

**Narrator:**
> "All departures were documented with technical rationale and trade-off analysis. Our compliance rate is approximately **95%** - maintaining architectural integrity while adapting to practical constraints."

---

## SECTION 6: Technical Challenges & Lessons (1 minute)

**[Screen: Team collaboration photo/diagram]**

**Narrator:**
> "Now let me share our team experience - the high points, low points, and major challenges."

### High Points (20 seconds)

**[Screen: Show git commit graph]**

**Narrator:**
> "**High points**: Our team successfully collaborated across different time zones using Git branching strategy. We implemented continuous integration early, which caught issues before they reached production."

> "The successful deployment of Llama-3-8B on CPU-only hardware was a major technical achievement - proving that smaller quantized models can deliver quality results without expensive GPU infrastructure."

### Low Points & Challenges (25 seconds)

**[Screen: Show old code vs new code comparison]**

**Narrator:**
> "**Major challenges**: First, **model compatibility**. Our initial choice of prompt format (ChatML) didn't work with TinyLlama. We had to research and implement the proper Llama chat template format, requiring refactoring of `prompt_builder.py`."

> "Second, **Docker build times**. Building the backend image with llama-cpp-python compilation took 15-20 minutes. We optimized with multi-stage builds and proper layer caching."

> "Third, **WSL2 port restrictions**. On Windows, port 3000 was blocked by Hyper-V exclusion ranges. We debugged this using `netsh` commands and found workarounds."

### Key Lessons (15 seconds)

**[Screen: Architecture compliance chart]**

**Narrator:**
> "**Key lessons learned**: Documentation is critical. Our detailed architecture documents and implementation departures made team handoffs smooth. Testing early on resource constraints revealed bottlenecks we could address during development, not deployment."

---

## SECTION 7: Deployment & Conclusion (30 seconds)

**[Screen: Terminal showing Docker deployment]**

**Narrator:**
> "Deployment is simple:"

**[Show commands]**
```bash
git clone <repository-url>
cd PocketLLM
docker-compose up -d --build
```

> "Docker automatically downloads the Llama-3-8B model, builds all images, and starts three containers: Next.js frontend, FastAPI backend, and Redis cache."

**[Screen: Browser showing running application]**

**Narrator:**
> "Within 15-20 minutes, you have a fully functional LLM chat application running on CPU-only hardware."

**[Screen: Final slide with project info]**

**Narrator:**
> "PocketLLM Portal demonstrates that thoughtful architecture enables powerful AI applications even under strict resource constraints. Thank you for watching!"

**Final Screen:**
- Project: PocketLLM Portal
- Architecture: Layered + Client-Server
- Model: Meta-Llama-3-8B-Instruct (CPU-only)
- Team: 6 members, USC CSCI 578 Fall 2025
- Repository: [GitHub link]

---

## Timing Breakdown

| Section | Duration | Content |
|---------|----------|---------|
| 1. Introduction | 30s | Team intro, project overview |
| 2. Architecture Overview | 45s | Layered architecture explanation |
| 3. Live Demo | 1m 30s | Login, chat, history, admin |
| 4. Architectural Strengths | 45s | Efficiency, caching, degradation |
| 5. Implementation Departures | 30s | 6 departures with rationale |
| 6. Challenges & Lessons | 1m | High/low points, lessons |
| 7. Deployment & Conclusion | 30s | Docker demo, closing |
| **Total** | **~5 minutes** | |

---

## Demo Preparation Checklist

### Before Recording:
- [ ] Fresh Docker deployment to show clean state
- [ ] Prepare sample questions for chat (pre-tested)
- [ ] Clear browser cache and cookies
- [ ] Have admin and user credentials ready
- [ ] Pre-populate 2-3 conversations in history
- [ ] Check all services are running: `docker-compose ps`
- [ ] Open relevant code files in IDE for screen sharing
- [ ] Prepare architecture diagrams for screen sharing
- [ ] Test streaming response works smoothly
- [ ] Verify admin dashboard shows accurate metrics

### Screen Recording Setup:
- [ ] 1920x1080 resolution minimum
- [ ] Clear audio recording (external mic recommended)
- [ ] Screen recorder ready (OBS, Zoom, etc.)
- [ ] Close unnecessary browser tabs
- [ ] Hide bookmarks bar for clean browser view
- [ ] Increase font size in terminal and IDE for visibility

### Live Demo Safety:
- [ ] Have backup recordings of critical sections
- [ ] Test demo flow at least twice before final recording
- [ ] Keep docker logs visible in separate terminal
- [ ] Prepare fallback if live demo fails

---

## Key Messages to Emphasize

1. **Architectural Fidelity**: 95% compliance with designed architecture
2. **Resource Efficiency**: Full LLM app in 4 vCPUs, 16GB RAM, CPU-only
3. **Production Ready**: Docker deployment, health checks, monitoring
4. **Intelligent Design**: Context-aware caching, graceful degradation
5. **Team Collaboration**: Successful 6-person collaboration using Git workflow
6. **Practical Adaptation**: Strategic departures with documented rationale

---

## Optional: Extended Technical Deep-Dive (if time permits)

**If demo runs under 5 minutes, can add:**
- Show actual `prompt_builder.py` code with Llama format
- Demonstrate cache hit vs miss in logs
- Show Docker image sizes: `docker images`
- Quick code walkthrough of streaming endpoint
- Show git branch history: `git log --graph --oneline`

---

## Backup Slides (in case of technical issues)

Prepare static slides showing:
1. Architecture diagram
2. System screenshots (login, chat, history, admin)
3. Code snippets (prompt builder, cache logic, streaming)
4. Deployment commands
5. Resource usage metrics
6. Team collaboration statistics (commits, PRs, etc.)

---

**Good luck with your demo! 🎬**
