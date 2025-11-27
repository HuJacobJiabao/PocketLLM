from typing import List, Optional
import json, hashlib

def estimate_tokens(text: Optional[str]) -> int:
    if not text:
        return 0
    chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    english = len(text.split())
    return chinese * 2 + english

MAX_HISTORY_TOKENS = 1024

def trim_conversation(messages: List, max_tokens: int = MAX_HISTORY_TOKENS):
    total = 0
    trimmed = []
    for msg in reversed(messages):
        tokens = estimate_tokens(msg.content)
        if total + tokens > max_tokens:
            break
        trimmed.insert(0, msg)
        total += tokens
    return trimmed

def load_system_prompt(path="prompt.txt") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except:
        return "You are a helpful assistant."

def build_prompt(history: List, system_prompt: str, user_message: str) -> str:
    prompt = system_prompt.strip() + "\n\n"
    for msg in history:
        role = msg.role.capitalize()
        content = msg.content.strip()
        if content:
            prompt += f"{role}: {content}\n"
    prompt += f"User: {user_message.strip()}\nAssistant:"
    return prompt

def build_cache_key(user_id: str, session_id: str, prompt: str, prev_response: str | None = None) -> str:
    data = {
        "user_id": user_id,
        "session_id": session_id,
        "prompt": prompt.strip(),
        "prev_response": prev_response.strip() if prev_response else None,
    }
    return json.dumps(data, sort_keys=True)
