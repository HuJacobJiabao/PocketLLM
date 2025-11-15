"""LLM inference service using llama.cpp."""
from typing import Optional, Iterator
from config import settings
import os

try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False


class LLMEngine:
    """Wrapper for llama.cpp inference engine."""

    def __init__(self):
        """Initialize LLM engine."""
        self.model: Optional[Llama] = None
        self.model_loaded = False
        self.model_path = settings.MODEL_PATH

    def load_model(self) -> bool:
        """Load the LLM model."""
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
                verbose=False
            )
            self.model_loaded = True
            print("Model loaded successfully.")
            return True
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.model_loaded = False
            return False

    def generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stream: bool = False
    ) -> str | Iterator[str]:
        """Generate text from prompt."""
        if not self.model_loaded or not self.model:
            # Return mock response if model not loaded
            return self._mock_generate(prompt, stream)

        try:
            output = self.model(
                prompt,
                max_tokens=max_tokens or settings.MODEL_MAX_TOKENS,
                temperature=temperature or settings.MODEL_TEMPERATURE,
                top_p=settings.MODEL_TOP_P,
                echo=False,
                stream=stream,
                stop=["</s>", "<|user|>", "<|system|>"]  # Stop tokens for TinyLlama-Chat format
            )

            if stream:
                return self._stream_output(output)
            else:
                return output['choices'][0]['text'].strip()

        except Exception as e:
            print(f"Generation error: {e}")
            return f"Error generating response: {str(e)}"

    def _stream_output(self, output) -> Iterator[str]:
        """Stream output tokens."""
        for chunk in output:
            token = chunk['choices'][0]['text']
            if token:
                yield token

    def _mock_generate(self, prompt: str, stream: bool) -> str | Iterator[str]:
        """Generate mock response when model not available."""
        response = f"Mock response for: {prompt[:50]}... (Model not loaded)"
        if stream:
            return iter([response])
        return response

    def get_model_info(self) -> dict:
        """Get model information."""
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
    """High-level service for LLM inference with caching."""

    def __init__(self, cache_manager, llm_engine: LLMEngine):
        """Initialize inference service."""
        self.cache_manager = cache_manager
        self.llm_engine = llm_engine

    def infer(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_cache: bool = True
    ) -> tuple[str, bool]:
        """
        Run inference with optional caching.

        Returns:
            tuple: (response, cached)
        """
        # Check cache first
        if use_cache:
            cached_response = self.cache_manager.get(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature
            )
            if cached_response:
                return cached_response, True

        # Generate response
        response = self.llm_engine.generate(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=False
        )

        # Cache the response
        if use_cache and isinstance(response, str):
            self.cache_manager.set(
                prompt,
                response,
                max_tokens=max_tokens,
                temperature=temperature
            )

        return response, False

    def stream_infer(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> Iterator[str]:
        """
        Stream inference response (no caching for streams).
        """
        return self.llm_engine.generate(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )
