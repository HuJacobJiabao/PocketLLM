from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Annotated, List
from schemas.chat import ChatRequest, ChatResponse, ChatHistory
from schemas.auth import TokenPayload
from utils.dependencies import get_current_user
import utils.dependencies as deps
from utils.prompt_builder import build_prompt, trim_conversation, load_system_prompt, build_cache_key
import uuid, json, asyncio
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()

    session_id = request.session_id or deps.session_service.create_session(current_user.sub)
    session = deps.session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.sub:
        raise HTTPException(status_code=403, detail="Permission denied")

    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="user",
        content=request.prompt,
        tokens_used=None,
    )

    history = trim_conversation(session.messages[:-1])
    system_prompt = load_system_prompt("prompt.txt")

    formatted_prompt = build_prompt(
        history=history,
        system_prompt=system_prompt,
        user_message=request.prompt,
    )

    response_text, cached = deps.inference_service.infer(
        prompt=formatted_prompt,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        use_cache=True,
    )

    tokens_used = len(response_text.split())

    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="assistant",
        content=response_text,
        tokens_used=tokens_used,
    )

    return ChatResponse(
        message_id=str(uuid.uuid4()),
        session_id=session_id,
        response=response_text,
        tokens_used=tokens_used,
        cached=cached,
        timestamp=datetime.utcnow(),
    )


@router.get("/history", response_model=List[ChatHistory])
async def get_history(current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    return deps.session_service.get_user_sessions(current_user.sub)


@router.get("/history/{session_id}", response_model=ChatHistory)
async def get_session_history(session_id: str, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    session = deps.session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.sub:
        raise HTTPException(status_code=403, detail="Permission denied")
    return session


@router.delete("/history/{session_id}")
async def delete_session(session_id: str, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()
    ok = deps.session_service.delete_session(session_id, current_user.sub)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}


@router.post("/stream")
async def send_message_stream(request: ChatRequest, current_user: Annotated[TokenPayload, Depends(get_current_user)]):
    deps.monitoring_service.increment_request_count()

    session_id = request.session_id or deps.session_service.create_session(current_user.sub)
    session = deps.session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.sub:
        raise HTTPException(status_code=403, detail="Permission denied")

    deps.session_service.add_message(
        session_id=session_id,
        user_id=current_user.sub,
        role="user",
        content=request.prompt,
        tokens_used=None,
    )

    history = trim_conversation(session.messages[:-1])
    system_prompt = load_system_prompt("prompt.txt")

    formatted_prompt = build_prompt(
        history=history,
        system_prompt=system_prompt,
        user_message=request.prompt,
    )

    async def generate_stream():
        full_response = ""
        message_id = str(uuid.uuid4())
        cached = False

        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id, 'message_id': message_id})}\n\n"

        cache_key = build_cache_key(current_user.sub, session_id, request.prompt, prev_response=None)
        cached_text = deps.cache_manager.get(
            cache_key,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        if cached_text:
            cached = True
            full_response = cached_text
            for i, w in enumerate(cached_text.split(" ")):
                token = w if i == 0 else " " + w
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                await asyncio.sleep(0.01)
        else:
            try:
                for token in deps.inference_service.stream_infer(
                    prompt=formatted_prompt,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                ):
                    if token:
                        full_response += token
                        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                        await asyncio.sleep(0)
                deps.cache_manager.set(
                    cache_key,
                    full_response,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                )
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                return

        tokens_used = len(full_response.split())
        deps.session_service.add_message(
            session_id=session_id,
            user_id=current_user.sub,
            role="assistant",
            content=full_response,
            tokens_used=tokens_used,
        )

        yield f"data: {json.dumps({'type': 'done', 'tokens_used': tokens_used, 'cached': cached, 'timestamp': datetime.utcnow().isoformat()})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
