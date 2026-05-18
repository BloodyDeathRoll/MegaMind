"""Shared streaming logic for all OpenAI-compatible API agents (Groq, Mistral, Grok, OpenAI)."""
import asyncio
import openai as openai_sdk

from backend.agents.base import AIAgent, AgentResponse


class OpenAICompatAgent(AIAgent):
    """Base class for any provider that speaks the OpenAI chat-completions API."""

    _client: openai_sdk.AsyncOpenAI
    _model: str
    _stream_options: bool = True  # set False for providers that don't support it (e.g. Mistral)

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
            kwargs = dict(model=self._model, messages=formatted, max_tokens=2048, stream=True)
            if self._stream_options:
                kwargs["stream_options"] = {"include_usage": True}
            stream = await self._client.chat.completions.create(**kwargs)

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
                if hasattr(chunk, "usage") and chunk.usage:
                    input_tokens = chunk.usage.prompt_tokens or 0
                    output_tokens = chunk.usage.completion_tokens or 0

        except Exception as e:
            await queue.put({
                "type": "error",
                "phase": phase,
                "agent_id": self.agent_id,
                "message": str(e),
            })
            raise

        cost = (input_tokens * self._price_input + output_tokens * self._price_output) / 1_000_000
        await queue.put({
            "type": "agent_done",
            "phase": phase,
            "agent_id": self.agent_id,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost,
        })

        return AgentResponse(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            content=full_content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
        )
