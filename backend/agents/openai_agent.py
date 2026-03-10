import openai as openai_sdk

from backend.agents._openai_compat import OpenAICompatAgent
from backend import config

# gpt-4o-mini pricing (USD per 1M tokens)
_PRICE_INPUT  = 0.15
_PRICE_OUTPUT = 0.60


class OpenAIAgent(OpenAICompatAgent):
    _price_input  = _PRICE_INPUT
    _price_output = _PRICE_OUTPUT

    def __init__(self, api_key: str | None = None):
        self._client = openai_sdk.AsyncOpenAI(api_key=api_key or config.OPENAI_API_KEY)
        self._model  = config.OPENAI_MODEL

    @property
    def agent_id(self) -> str:
        return "gpt4"

    @property
    def agent_name(self) -> str:
        return "ChatGPT"
