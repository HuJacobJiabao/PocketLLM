from typing import Optional, Iterator
from config import settings
import os
import time

try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False


class LLMEngine:
    """Wrapper for llama.cpp inference engine."""

    def __init__(self):
        self.model: Optional[Llama] = None
        self.model_loaded = False
        self.model_path = settings.MODEL_PATH

    def load_model(self) -> bool:
        if not LLAMA_CPP_AVAILABLE:
            print("llama-cpp-python not available. Model loading disabled.")
            return False

        if not os.path.exists(self.model_path):
            print(f"Model file not found: {self.model_path}")
            print("Please download a model and place it in the correct location.")
            return False

        try:
            print(f"Loading model from {self.model_path}...")
            self.model = Llama(
                model_path=self.model_path,
                n_ctx=settings.MODEL_N_CTX,
                n_threads=settings.MODEL_N_THREADS,
                n_gpu_layers=settings.MODEL_N_GPU_LAYERS,
                verbose=True  # 打开详细日志
            )
            self.model_loaded = True
            print("✅ Model loaded successfully.")
            return True
        except Exception as e:
            import traceback
            print(f"❌ Failed to load model: {e}")
            traceback.print_exc()  # 打印完整错误堆栈
            self.model_loaded = False
            return False

    def generate(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None, stream: bool = False) -> str | Iterator[str]:
        if not self.model_loaded or not self.model:
            return self._mock_generate(prompt, stream)

        try:
            output = self.model(
                prompt,
                max_tokens=max_tokens or settings.MODEL_MAX_TOKENS,
                temperature=temperature or settings.MODEL_TEMPERATURE,
                top_p=settings.MODEL_TOP_P,
                echo=False,
                stream=stream,
                stop=["</s>", "\nUser:", "\nAssistant:"],
                repeat_penalty=1.1
            )

            if stream:
                return self._stream_output(output)
            else:
                response = output['choices'][0]['text'].strip()
                response = self._clean_response(response)
                return response

        except Exception as e:
            print(f"Generation error: {e}")
            return f"Error generating response: {str(e)}"

    def _stream_output(self, output) -> Iterator[str]:
        buffer = ""
        full_text = ""
        first_token = True
        for chunk in output:
            token = chunk['choices'][0]['text']
            if token:
                buffer += token
                full_text += token
                if first_token:
                    buffer = self._clean_response(buffer)
                    if buffer:
                        yield buffer
                        buffer = ""
                        first_token = False
                else:
                    if any(sig in full_text for sig in ["\nBest regards", "Best regards", "\nSincerely", ", ai assistant"]):
                        break
                    yield token

    def _clean_response(self, text: str) -> str:
        prefixes = ["AI:", "AI :", "Assistant:", "Assistant :", "A:", "A :", "User:", "User :"]
        for prefix in prefixes:
            if text.startswith(prefix):
                text = text[len(prefix):].lstrip()
                break

        signatures = [
            "\nBest regards", "Best regards",
            "\nSincerely", "Sincerely",
            "\nRegards", "Regards",
            "\n\nBest", "\n\nSincerely",
            ", ai assistant", ",\nai assistant",
            "[Request interrupted by user]"
        ]
        for signature in signatures:
            if signature in text:
                text = text.split(signature)[0]

        return text.strip()

    def _mock_generate(self, prompt: str, stream: bool) -> str | Iterator[str]:
        user_query = "your question"
        if "<|user|>" in prompt:
            parts = prompt.split("<|user|>")
            if len(parts) > 1:
                last_user_msg = parts[-1].split("</s>")[0].strip()
                if last_user_msg:
                    user_query = last_user_msg[:50]

        response = f"[FAIL TO LOAD MODEL] Could not process: '{user_query}'. The actual LLM model is not loaded or failed to initialize."

        if stream:
            words = response.split(' ')
            def word_generator():
                for i, word in enumerate(words):
                    time.sleep(0.05)
                    if i == 0:
                        yield word
                    else:
                        yield ' ' + word
            return word_generator()
        return response

    def get_model_info(self) -> dict:
        return {
            "model_path": self.model_path,
            "model_loaded": self.model_loaded,
            "n_ctx": settings.MODEL_N_CTX,
            "n_threads": settings.MODEL_N_THREADS,
            "n_gpu_layers": settings.MODEL_N_GPU_LAYERS,
            "temperature": settings.MODEL_TEMPERATURE,
            "top_p": settings.MODEL_TOP_P,
            "max_tokens": settings.MODEL_MAX_TOKENS
        }


class ModelInferenceService:
    def __init__(self, cache_manager, llm_engine: LLMEngine):
        self.cache_manager = cache_manager
        self.llm_engine = llm_engine

    def infer(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None, use_cache: bool = True) -> tuple[str, bool]:
        if use_cache:
            cached_response = self.cache_manager.get(prompt, max_tokens=max_tokens, temperature=temperature)
            if cached_response:
                return cached_response, True

        response = self.llm_engine.generate(prompt, max_tokens=max_tokens, temperature=temperature, stream=False)

        if use_cache and isinstance(response, str):
            self.cache_manager.set(prompt, response, max_tokens=max_tokens, temperature=temperature)

        return response, False

    def stream_infer(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> Iterator[str]:
        return self.llm_engine.generate(prompt, max_tokens=max_tokens, temperature=temperature, stream=True)
