import openai as openai_sdk

from backend.agents._openai_compat import OpenAICompatAgent
from backend import config

# Grok-2 pricing (USD per 1M tokens)
_PRICE_INPUT  = 2.0
_PRICE_OUTPUT = 10.0


class GrokAgent(OpenAICompatAgent):
    _price_input  = _PRICE_INPUT
    _price_output = _PRICE_OUTPUT

    def __init__(self, api_key: str | None = None):
        self._client = openai_sdk.AsyncOpenAI(
            api_key=api_key or config.GROK_API_KEY,
            base_url="https://api.x.ai/v1",
        )
        self._model = config.GROK_MODEL

    @property
    def agent_id(self) -> str:
        return "grok"

    @property
    def agent_name(self) -> str:
        return "Grok"
