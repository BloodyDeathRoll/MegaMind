import asyncio
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.pipeline.orchestrator import run_debate
from backend import config

app = FastAPI(title="MegaMind AI Think Tank")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static agent catalogue — availability is determined by the user's own API keys,
# not by env variables. The env keys act as a fallback / dev convenience only.
AGENT_CATALOGUE = [
    {"id": "claude", "name": "Claude"},
    {"id": "gpt4",   "name": "ChatGPT"},
    {"id": "gemini", "name": "Gemini"},
]


def _build_agent(agent_id: str, user_key: str | None):
    """Create an agent instance using the user-provided key, falling back to env."""
    if agent_id == "claude":
        from backend.agents.claude_agent import ClaudeAgent
        key = user_key or config.ANTHROPIC_API_KEY
        return ClaudeAgent(api_key=key) if key else None

    if agent_id == "gpt4":
        from backend.agents.openai_agent import OpenAIAgent
        key = user_key or config.OPENAI_API_KEY
        return OpenAIAgent(api_key=key) if key else None

    if agent_id == "gemini":
        from backend.agents.gemini_agent import GeminiAgent
        key = user_key or config.GOOGLE_API_KEY
        return GeminiAgent(api_key=key) if key else None

    return None


# --- Routes ---

@app.get("/api/agents")
async def get_agents():
    """Return the agent catalogue, flagging which ones have backend keys configured."""
    agents = []
    for a in AGENT_CATALOGUE:
        available = bool(_build_agent(a["id"], None))
        agents.append({**a, "available": available})
    return {"agents": agents}


class DebateRequest(BaseModel):
    prompt: str
    agent_ids: list[str]
    rounds: int = 4
    synthesis_agent_id: str
    api_keys: dict[str, str] = {}   # user-provided keys; values may be empty strings


@app.post("/api/debate")
async def debate(request: DebateRequest):
    user_keys = {k: v for k, v in request.api_keys.items() if v}

    agents = []
    for aid in request.agent_ids:
        agent = _build_agent(aid, user_keys.get(aid))
        if agent:
            agents.append(agent)

    if not agents:
        raise HTTPException(status_code=400, detail="No valid agents — check your API keys.")

    synthesis_agent = _build_agent(
        request.synthesis_agent_id,
        user_keys.get(request.synthesis_agent_id),
    ) or agents[0]

    rounds = max(2, min(4, request.rounds))
    queue: asyncio.Queue = asyncio.Queue()

    async def run():
        try:
            await run_debate(
                agents=agents,
                user_prompt=request.prompt,
                rounds=rounds,
                synthesis_agent=synthesis_agent,
                queue=queue,
            )
        except Exception as e:
            await queue.put({"type": "fatal_error", "message": str(e)})

    debate_task = asyncio.create_task(run())

    async def event_stream():
        try:
            while True:
                event = await queue.get()
                yield {"data": json.dumps(event)}
                if event.get("type") in ("done", "fatal_error"):
                    break
        except asyncio.CancelledError:
            debate_task.cancel()
            raise
        await debate_task

    return EventSourceResponse(event_stream())
