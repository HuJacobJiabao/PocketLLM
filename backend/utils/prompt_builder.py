from typing import List, Optional
import json, hashlib
from config import settings

def load_system_prompt(path="prompt.txt") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            # Remove the template placeholders if they exist
            content = content.replace("Instruction: {prompt}", "").strip()
            content = content.replace("Response:", "").strip()
            if not content:
                return "You are a helpful AI assistant."
            return content
    except:
        return "You are a helpful AI assistant."

def fmt_chat(role: str, content: str) -> str:
    return (
        f"<|start_header_id|>{role}<|end_header_id|>\n"
        f"{content.strip()}\n"
    )

def _estimate_tokens(text: str) -> int:
    """
    估算文本的 token 数量
    简单估算：1 token ≈ 4 个字符（对于英文），中文约 1.5 个字符
    这里使用保守估算：1 token ≈ 3 个字符
    """
    return len(text) // 3

def build_prompt(messages: List, system_prompt: str, new_user_prompt: str, max_context_tokens: Optional[int] = None) -> str:
    """
    构建提示词，确保系统提示词始终保留
    
    Args:
        messages: 历史消息列表
        system_prompt: 系统提示词（必须保留）
        new_user_prompt: 新的用户输入（必须保留）
        max_context_tokens: 最大上下文 token 数（默认从配置读取）
    
    Returns:
        构建好的完整提示词
    """
    # 使用配置中的 context window 大小
    if max_context_tokens is None:
        max_context_tokens = settings.MODEL_N_CTX
    
    # 1. 构建系统提示词和用户输入（必须保留）
    system_part = fmt_chat("system", system_prompt)
    user_part = fmt_chat("user", new_user_prompt.strip())
    assistant_header = "<|start_header_id|>assistant<|end_header_id|>\n"
    
    # 计算必须保留部分的 token 数
    required_tokens = _estimate_tokens(system_part + user_part + assistant_header)
    
    # 2. 为历史消息预留空间（至少保留 512 tokens 给回复）
    available_tokens = max_context_tokens - required_tokens - 512
    
    # 3. 从历史消息中筛选，确保不超过可用空间
    selected_messages = []
    current_tokens = 0
    
    # 从最新的消息开始（倒序），因为要保留最近的对话
    for msg in reversed(messages):
        role = msg.role
        content = (msg.content or "").strip()
        if not content:
            continue
        
        msg_text = fmt_chat(role, content)
        msg_tokens = _estimate_tokens(msg_text)
        
        # 如果加上这条消息不超过限制，就添加
        if current_tokens + msg_tokens <= available_tokens:
            selected_messages.insert(0, msg)  # 插入到开头保持顺序
            current_tokens += msg_tokens
        else:
            # 如果空间不足，停止添加
            break
    
    # 4. 构建最终提示词
    parts = []
    parts.append(system_part)  # 系统提示词始终在最前面
    
    # 添加筛选后的历史消息
    for msg in selected_messages:
        role = msg.role
        content = (msg.content or "").strip()
        if content:
            parts.append(fmt_chat(role, content))
    
    # 添加用户输入和助手标记
    parts.append(user_part)
    parts.append(assistant_header)
    
    return "".join(parts)

def build_cache_key(user_id: str, session_id: str, prompt: str, prev_response: str | None = None) -> str:
    cache_key = json.dumps({
        "user_id": user_id,
        "session_id": session_id,
        "prompt": prompt.strip(),
        "prev_response": prev_response.strip() if prev_response else None
    }, sort_keys=True)
    return cache_key
