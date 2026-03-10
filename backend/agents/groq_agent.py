import openai as openai_sdk

from backend.agents._openai_compat import OpenAICompatAgent
from backend import config

# Groq is free; costs reported as $0
_PRICE_INPUT  = 0.0
_PRICE_OUTPUT = 0.0


class GroqAgent(OpenAICompatAgent):
    _price_input  = _PRICE_INPUT
    _price_output = _PRICE_OUTPUT

    def __init__(self, api_key: str | None = None):
        self._client = openai_sdk.AsyncOpenAI(
            api_key=api_key or config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        self._model = config.GROQ_MODEL

    @property
    def agent_id(self) -> str:
        return "llama"

    @property
    def agent_name(self) -> str:
        return "Llama"
