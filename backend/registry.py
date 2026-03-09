from backend.agents.base import AIAgent


class AgentRegistry:
    """Discovers and manages available agent plug-ins."""

    def __init__(self):
        self._agents: dict[str, AIAgent] = {}

    def register(self, agent: AIAgent) -> None:
        self._agents[agent.agent_id] = agent

    def get(self, agent_id: str) -> AIAgent | None:
        return self._agents.get(agent_id)

    def has(self, agent_id: str) -> bool:
        return agent_id in self._agents

    def all(self) -> list[AIAgent]:
        return list(self._agents.values())

    def available_ids(self) -> list[str]:
        return list(self._agents.keys())
