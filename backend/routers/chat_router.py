from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Annotated, List
from schemas.chat import ChatRequest, ChatResponse, ChatHistory
from schemas.auth import TokenPayload
from utils.dependencies import get_current_user
from utils.prompt_builder import build_prompt, trim_conversation, get_system_prompt, build_cache_key
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

    # Create or get session
    session_id = request.session_id
    if not session_id:
        session_id = deps.session_service.create_session(current_user.sub)
    else:
        session = deps.session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        if session.user_id != current_user.sub:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this session")

    # Add user message to session
    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="user",
        content=request.prompt,
        tokens_used=None
    )

    # Get conversation history and trim
    session = deps.session_service.get_session(session_id)
    conversation_history = session.messages if session else []
    conversation_history = trim_conversation(conversation_history[:-1])

    # Build formatted prompt
    system_prompt = get_system_prompt("default")
    formatted_prompt = build_prompt(conversation_history, system_prompt, request.prompt)

    # Run LLM inference
    response_text, cached = deps.inference_service.infer(
        prompt=formatted_prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        use_cache=True
    )

    tokens_used = len(response_text.split())

    # Add assistant message
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this session")

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
    conversation_history = trim_conversation(conversation_history[:-1])

    system_prompt = get_system_prompt("default")
    formatted_prompt = build_prompt(conversation_history, system_prompt, request.prompt)

    async def generate_stream():
        full_response = ""
        message_id = str(uuid.uuid4())
        cached = False

        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id, 'message_id': message_id})}\n\n"

        cache_key = build_cache_key(current_user.sub, session_id, request.prompt)
        cached_response = deps.cache_manager.get(cache_key, max_tokens=request.max_tokens, temperature=request.temperature)

        if cached_response:
            cached = True
            full_response = cached_response
            for i, word in enumerate(cached_response.split(' ')):
                token = word if i == 0 else ' ' + word
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                await asyncio.sleep(0.01)
        else:
            try:
                token_stream = deps.inference_service.stream_infer(
                    prompt=formatted_prompt,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature
                )

                for token in token_stream:
                    if token:
                        full_response += token
                        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                        await asyncio.sleep(0)

                if full_response:
                    deps.cache_manager.set(cache_key, full_response, max_tokens=request.max_tokens, temperature=request.temperature)

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                return

        tokens_used = len(full_response.split())
        deps.session_service.add_message(
            session_id=session_id,
            user_id=current_user.sub,
            role="assistant",
            content=full_response,
            tokens_used=tokens_used
        )

        yield f"data: {json.dumps({'type': 'done', 'tokens_used': tokens_used, 'cached': cached, 'timestamp': datetime.utcnow().isoformat()})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
