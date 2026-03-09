import asyncio
import anthropic

from backend.agents.base import AIAgent, AgentResponse
from backend import config

# Pricing for claude-3-5-haiku-20241022 (USD per 1M tokens)
_PRICE_INPUT = 0.80
_PRICE_OUTPUT = 4.00


class ClaudeAgent(AIAgent):
    def __init__(self, api_key: str | None = None):
        self._client = anthropic.AsyncAnthropic(api_key=api_key or config.ANTHROPIC_API_KEY)
        self._model = config.CLAUDE_MODEL

    @property
    def agent_id(self) -> str:
        return "claude"

    @property
    def agent_name(self) -> str:
        return "Claude"

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

        try:
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=2048,
                system=system_prompt,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    full_content += text
                    await queue.put({
                        "type": "token",
                        "phase": phase,
                        "agent_id": self.agent_id,
                        "agent_name": self.agent_name,
                        "chunk": text,
                    })

                final = await stream.get_final_message()
                input_tokens = final.usage.input_tokens
                output_tokens = final.usage.output_tokens

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
