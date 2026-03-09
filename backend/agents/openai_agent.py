import asyncio
import openai as openai_sdk

from backend.agents.base import AIAgent, AgentResponse
from backend import config

# Pricing for gpt-4o-mini (USD per 1M tokens)
_PRICE_INPUT = 0.15
_PRICE_OUTPUT = 0.60


class OpenAIAgent(AIAgent):
    def __init__(self, api_key: str | None = None):
        self._client = openai_sdk.AsyncOpenAI(api_key=api_key or config.OPENAI_API_KEY)
        self._model = config.OPENAI_MODEL

    @property
    def agent_id(self) -> str:
        return "gpt4"

    @property
    def agent_name(self) -> str:
        return "GPT-4"

    async def stream_send(
        self,
        system_prompt: str,
        messages: list[dict],
        queue: asyncio.Queue,
        phase: str,
    ) -> AgentResponse:
        full_content = ""
        input_tokens = 0
        output_tokens = 0

        formatted = [{"role": "system", "content": system_prompt}] + messages

        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=formatted,
                max_tokens=2048,
                stream=True,
                stream_options={"include_usage": True},
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_content += text
                    await queue.put({
                        "type": "token",
                        "phase": phase,
                        "agent_id": self.agent_id,
                        "agent_name": self.agent_name,
                        "chunk": text,
                    })
                # Final chunk carries usage
                if hasattr(chunk, "usage") and chunk.usage:
                    input_tokens = chunk.usage.prompt_tokens
                    output_tokens = chunk.usage.completion_tokens

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
