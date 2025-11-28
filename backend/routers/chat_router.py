from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Annotated, List
from schemas.chat import ChatRequest, ChatResponse, ChatHistory
from schemas.auth import TokenPayload
from utils.dependencies import get_current_user
from utils.prompt_builder import (
    build_prompt,
    load_system_prompt,
    build_cache_key
)
import utils.dependencies as deps
from datetime import datetime
import uuid
import json
import asyncio

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: Annotated[TokenPayload, Depends(get_current_user)]
):
    deps.monitoring_service.increment_request_count()

    session_id = request.session_id
    if not session_id:
        session_id = deps.session_service.create_session(current_user.sub)
    else:
        session = deps.session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if session.user_id != current_user.sub:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this session")

    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="user",
        content=request.prompt,
        tokens_used=None
    )

    session = deps.session_service.get_session(session_id)
    conversation_history = session.messages if session else []

    # Only keep recent conversation history
    conversation_history = conversation_history[:-1][-3:]

    system_prompt = load_system_prompt("prompt.txt")
    formatted_prompt = build_prompt(conversation_history, system_prompt, request.prompt)

    response_text, cached = deps.inference_service.infer(
        prompt=formatted_prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        use_cache=True
    )

    tokens_used = len(response_text.split())

    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="assistant",
        content=response_text,
        tokens_used=tokens_used
    )

    return ChatResponse(
        message_id=str(uuid.uuid4()),
        session_id=session_id,
        response=response_text,
        tokens_used=tokens_used,
        cached=cached,
        timestamp=datetime.utcnow()
    )


@router.get("/history", response_model=List[ChatHistory])
async def get_history(current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    sessions = deps.session_service.get_user_sessions(current_user.sub)
    return sessions


@router.get("/history/{session_id}", response_model=ChatHistory)
async def get_session_history(session_id: str, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    session = deps.session_service.get_session(session_id)

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.user_id != current_user.sub:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return session


@router.delete("/history/{session_id}")
async def delete_session(session_id: str, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    success = deps.session_service.delete_session(session_id, current_user.sub)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return {"message": "Session deleted successfully"}


@router.post("/stream")
async def send_message_stream(
    request: ChatRequest,
    current_user: Annotated[TokenPayload, Depends(get_current_user)]
):
    deps.monitoring_service.increment_request_count()
    
    print(f"[DEBUG] Stream request from user: {current_user.username} (ID: {current_user.sub})")
    print(f"[DEBUG] Request session_id: {request.session_id}")

    # FIX: Ensure session_id is properly initialized
    session_id = request.session_id
    if not session_id:
        # Create new session for this user
        session_id = deps.session_service.create_session(current_user.sub)
        print(f"[DEBUG] Created new session: {session_id}")
    else:
        # Validate existing session ownership
        session = deps.session_service.get_session(session_id)
        if not session:
            print(f"[ERROR] Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        if session.user_id != current_user.sub:
            print(f"[ERROR] Access denied - session owner: {session.user_id}, requester: {current_user.sub}")
            raise HTTPException(status_code=403, detail="Access denied to this session")
        print(f"[DEBUG] Validated existing session: {session_id}")

    # FIX: Add user message BEFORE streaming starts
    try:
        deps.session_service.add_message(
            session_id=session_id,
            user_id=current_user.sub,
            role="user",
            content=request.prompt,
            tokens_used=None
        )
        print(f"[DEBUG] Added user message to session {session_id}")
    except ValueError as e:
        # If session validation fails, return proper error
        print(f"[ERROR] Failed to add user message: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        print(f"[ERROR] Unexpected error adding user message: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save message: {str(e)}")

    # Get conversation history (excluding the message we just added)
    session = deps.session_service.get_session(session_id)
    conversation_history = session.messages if session else []
    conversation_history = conversation_history[:-1][-5:]

    system_prompt = load_system_prompt("prompt.txt")
    formatted_prompt = build_prompt(conversation_history, system_prompt, request.prompt)

    async def generate_stream():
        full_response = ""
        message_id = str(uuid.uuid4())
        cached = False

        try:
            print(f"[DEBUG] Starting stream generation for session {session_id}")
            yield f"data: {json.dumps({'type': 'start', 'session_id': session_id, 'message_id': message_id})}\n\n"

            cache_key = build_cache_key(
                current_user.sub,
                session_id,
                formatted_prompt,
                prev_response=None
            )

            cached_response = deps.cache_manager.get(
                cache_key,
                max_tokens=request.max_tokens,
                temperature=request.temperature
            )

            if cached_response:
                print(f"[DEBUG] Using cached response for session {session_id}")
                cached = True
                full_response = cached_response
                for i, word in enumerate(cached_response.split(' ')):
                    token = word if i == 0 else ' ' + word
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                    await asyncio.sleep(0.01)
            else:
                print(f"[DEBUG] Generating new response for session {session_id}")
                try:
                    token_stream = deps.inference_service.stream_infer(
                        prompt=formatted_prompt,
                        max_tokens=request.max_tokens,
                        temperature=request.temperature
                    )

                    token_count = 0
                    for token in token_stream:
                        if token:
                            full_response += token
                            token_count += 1
                            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                            await asyncio.sleep(0)
                    
                    print(f"[DEBUG] Generated {token_count} tokens for session {session_id}")

                    if full_response:
                        deps.cache_manager.set(
                            cache_key,
                            full_response,
                            max_tokens=request.max_tokens,
                            temperature=request.temperature
                        )

                except Exception as e:
                    error_msg = f"Generation error: {type(e).__name__}: {str(e)}"
                    print(f"[ERROR] {error_msg}")
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    return

            # FIX: Add assistant message with proper error handling
            try:
                tokens_used = len(full_response.split())
                deps.session_service.add_message(
                    session_id=session_id,
                    user_id=current_user.sub,  # Use current_user.sub consistently
                    role="assistant",
                    content=full_response,
                    tokens_used=tokens_used
                )
                print(f"[DEBUG] Saved assistant message to session {session_id}")
            except ValueError as e:
                # Log error but don't fail the stream
                print(f"[WARNING] Failed to save assistant message: {str(e)}")
            except Exception as e:
                print(f"[ERROR] Unexpected error saving assistant message: {type(e).__name__}: {str(e)}")

            yield f"data: {json.dumps({'type': 'done', 'tokens_used': len(full_response.split()), 'cached': cached, 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            print(f"[DEBUG] Stream completed for session {session_id}")
            
        except Exception as e:
            error_msg = f"Stream error: {type(e).__name__}: {str(e)}"
            print(f"[ERROR] {error_msg}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )