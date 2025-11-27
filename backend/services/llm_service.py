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
            return False

        try:
            print(f"Loading model from {self.model_path}...")

            self.model = Llama(
                model_path=self.model_path,
                n_ctx=settings.MODEL_N_CTX,
                n_threads=settings.MODEL_N_THREADS,
                n_gpu_layers=settings.MODEL_N_GPU_LAYERS,
                n_batch=settings.MODEL_N_BATCH,
                cache=True,
                verbose=True
            )

            self.model_loaded=True
            print("✅ Model loaded successfully.")
            return True
        
        except Exception as e:
            self.model_loaded = False
            print(f"❌ Failed to load model: {e}")
            return False

    def generate(
        self, 
        prompt: str, 
        max_tokens: Optional[int] = None, 
        temperature: Optional[float] = None, 
        stream: bool = False
    ) -> str | Iterator[str]:

        if not self.model_loaded:
            raise RuntimeError("Model not loaded. Cannot generate.")

        try:
            output = self.model(
                prompt,
                max_tokens=max_tokens or settings.MODEL_MAX_TOKENS,
                temperature=temperature or settings.MODEL_TEMPERATURE,
                top_p=settings.MODEL_TOP_P,
                echo=False,
                stream=stream,
                repeat_penalty=1.1,
                stop=[
                    "User:",
                    "Assistant:",
                ],
            )

            if stream:
                return self._stream_output(output)
            
            text = output["choices"][0]["text"].strip()
            return self._clean_response(text)

        except Exception as e:
            print(f"Generation error: {e}")
            raise

    def _stream_output(self, output) -> Iterator[str]:
        for chunk in output:
            token = chunk["choices"][0]["text"]
            if not token or token.strip().lower() in ["<think>", "</think>"]:
                continue
            yield token

    def _clean_response(self, text: str) -> str:
        import re

        if not text:
            return ""

        text = re.sub(r"(?is)<think>.*?</think>", "", text)
        text = re.sub(r"</\|im_end>>", "", text)
        text = re.sub(r"<\|im_end\|>", "", text)

        bad = [
            r"let me", r"i need to", r"i remember", r"wait",
            r"first[, ]", r"maybe", r"another thing",
            r"i'm trying", r"now,", r"let's", r"in conclusion"
        ]
        rm = re.compile(r"(?i)(" + "|".join(bad) + ")")

        lines = [l.strip() for l in text.split("\n") if l.strip()]
        clean = [l for l in lines if not rm.search(l)]

        result = []
        for l in clean:
            if l not in result:
                result.append(l)

        return "\n".join(result).strip()

    def get_model_info(self) -> dict:
        return {
            "model_path": self.model_path,
            "model_loaded": self.model_loaded,
            "n_ctx": settings.MODEL_N_CTX,
            "n_threads": settings.MODEL_N_THREADS,
            "n_gpu_layers": settings.MODEL_N_GPU_LAYERS,
            "max_tokens": settings.MODEL_MAX_TOKENS,
            "temperature": settings.MODEL_TEMPERATURE,
            "top_p": settings.MODEL_TOP_P,
            "n_batch": settings.MODEL_N_BATCH,
        }


class ModelInferenceService:
    def __init__(self, cache_manager, llm_engine: LLMEngine):
        self.cache_manager = cache_manager
        self.llm_engine = llm_engine

    def infer(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None, use_cache: bool = True) -> tuple[str, bool]:
        if use_cache:
            cached = self.cache_manager.get(prompt, max_tokens=max_tokens, temperature=temperature)
            if cached:
                return cached, True

        response = self.llm_engine.generate(prompt, max_tokens=max_tokens, temperature=temperature, stream=False)

        if use_cache and isinstance(response, str):
            self.cache_manager.set(prompt, response, max_tokens=max_tokens, temperature=temperature)

        return response, False

    def stream_infer(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> Iterator[str]:
        return self.llm_engine.generate(prompt, max_tokens=max_tokens, temperature=temperature, stream=True)
