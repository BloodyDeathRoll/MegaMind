import openai as openai_sdk

from backend.agents._openai_compat import OpenAICompatAgent
from backend import config

# Mistral free tier; costs reported as $0
_PRICE_INPUT  = 0.0
_PRICE_OUTPUT = 0.0


class MistralAgent(OpenAICompatAgent):
    _price_input  = _PRICE_INPUT
    _price_output = _PRICE_OUTPUT
    _stream_options = False  # Mistral rejects stream_options

    def __init__(self, api_key: str | None = None):
        self._client = openai_sdk.AsyncOpenAI(
            api_key=api_key or config.MISTRAL_API_KEY,
            base_url="https://api.mistral.ai/v1",
        )
        self._model = config.MISTRAL_MODEL

    @property
    def agent_id(self) -> str:
        return "mistral"

    @property
    def agent_name(self) -> str:
        return "Mistral"
