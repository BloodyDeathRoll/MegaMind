from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class AgentResponse:
    agent_id: str
    agent_name: str
    content: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0

    @property
    def tokens_used(self) -> int:
        return self.input_tokens + self.output_tokens


class AIAgent(ABC):
    """All model plug-ins implement this interface. The orchestrator only talks to this."""

    @property
    @abstractmethod
    def agent_id(self) -> str: ...

    @property
    @abstractmethod
    def agent_name(self) -> str: ...

    @abstractmethod
    async def stream_send(
        self,
        system_prompt: str,
        messages: list[dict],
        queue: "asyncio.Queue",
        phase: str,
    ) -> AgentResponse:
        """Stream response chunks to queue and return the complete AgentResponse."""
        ...
