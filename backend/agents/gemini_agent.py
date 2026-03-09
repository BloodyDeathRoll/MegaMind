import asyncio
from google import genai
from google.genai import types

from backend.agents.base import AIAgent, AgentResponse
from backend import config

# Pricing for gemini-2.0-flash (USD per 1M tokens)
_PRICE_INPUT  = 0.10
_PRICE_OUTPUT = 0.40


class GeminiAgent(AIAgent):
    def __init__(self, api_key: str | None = None):
        self._client = genai.Client(api_key=api_key or config.GOOGLE_API_KEY)
        self._model = "gemini-2.0-flash"

    @property
    def agent_id(self) -> str:
        return "gemini"

    @property
    def agent_name(self) -> str:
        return "Gemini"

    async def stream_send(
        self,
        system_prompt: str,
        messages: list[dict],
        queue: asyncio.Queue,
        phase: str,
    ) -> AgentResponse:
        full_content = ""
        input_tokens  = 0
        output_tokens = 0

        # Build contents list (user/model turns only; system is separate)
        contents = []
        for m in messages:
            role = "model" if m["role"] == "assistant" else "user"
            contents.append(types.Content(role=role, parts=[types.Part(text=m["content"])]))

        config_obj = types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=2048,
        )

        try:
            async for chunk in await self._client.aio.models.generate_content_stream(
                model=self._model,
                contents=contents,
                config=config_obj,
            ):
                text = chunk.text or ""
                if text:
                    full_content += text
                    await queue.put({
                        "type": "token",
                        "phase": phase,
                        "agent_id": self.agent_id,
                        "agent_name": self.agent_name,
                        "chunk": text,
                    })
                # Token counts on usage_metadata
                if chunk.usage_metadata:
                    input_tokens  = chunk.usage_metadata.prompt_token_count or input_tokens
                    output_tokens = chunk.usage_metadata.candidates_token_count or output_tokens

        except Exception as e:
            await queue.put({
                "type": "error",
                "phase": phase,
                "agent_id": self.agent_id,
                "message": str(e),
            })
            raise

        cost = (input_tokens * _PRICE_INPUT + output_tokens * _PRICE_OUTPUT) / 1_000_000
        response = AgentResponse(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            content=full_content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
        )

        await queue.put({
            "type": "agent_done",
            "phase": phase,
            "agent_id": self.agent_id,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost,
        })

        return response
