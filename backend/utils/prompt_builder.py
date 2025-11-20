from typing import List

# Maximum token threshold for trimming conversation context
MAX_HISTORY_TOKENS = 1024


def trim_conversation(messages: List, max_tokens: int = MAX_HISTORY_TOKENS):
    """Trim conversation history to fit within token budget (approximate by word count)."""
    total = 0
    trimmed = []
    for msg in reversed(messages):
        tokens = len(msg.content.split())
        if total + tokens > max_tokens:
            break
        trimmed.insert(0, msg)
        total += tokens
    return trimmed


def build_prompt(messages: List, system_prompt: str, new_user_prompt: str) -> str:
    """Build a formatted prompt for Qwen (通义千问) model."""
    prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"

    for msg in messages:
        if msg.role == "user":
            prompt += f"<|im_start|>user\n{msg.content}<|im_end|>\n"
        elif msg.role == "assistant":
            prompt += f"<|im_start|>assistant\n{msg.content}<|im_end|>\n"

    prompt += f"<|im_start|>user\n{new_user_prompt}<|im_end|>\n<|im_start|>assistant\n"
    return prompt


def get_system_prompt(role: str = "default") -> str:
    """Retrieve system prompt template by role type."""
    system_prompts = {
        "default": "You are a helpful assistant. Answer concisely and directly.",
        "developer": "You are an expert software engineer skilled in C++, Python, and system design. Provide accurate and efficient solutions.",
        "summarizer": "You are a summarization assistant. Write clear, concise summaries of provided text.",
        "analyst": "You are a data and research analyst. Present structured, factual insights with clarity.",
    }
    return system_prompts.get(role, system_prompts["default"])


def build_cache_key(user_id: str, session_id: str, prompt: str, prev_response: str | None = None) -> str:
    """Generate a consistent cache key for a given user/session/prompt context."""
    import json
    cache_key = json.dumps({
        "user_id": user_id,
        "session_id": session_id,
        "prompt": prompt.strip(),
        "prev_response": prev_response.strip() if prev_response else None
    }, sort_keys=True)
    return cache_key