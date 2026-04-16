import asyncio
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from backend.pipeline.orchestrator import run_debate
from backend import config

app = FastAPI(title="MegaMind AI Think Tank")

import os
_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        *_extra_origins,
    ],
    allow_origin_regex=r"https://(.*\.vercel\.app|.*\.hf\.space)",
    allow_methods=["*"],
    allow_headers=["*"],
)

# tier: "free"    → server provides the key; always usable at no cost to user
# tier: "premium" → user must supply their own API key
AGENT_CATALOGUE = [
    {"id": "llama",   "name": "Llama",    "tier": "free"},
    {"id": "mistral", "name": "Mistral",  "tier": "free"},
    {"id": "claude",  "name": "Claude",   "tier": "premium"},
    {"id": "gpt4",    "name": "ChatGPT",  "tier": "premium"},
    {"id": "gemini",  "name": "Gemini",   "tier": "premium"},
    {"id": "grok",    "name": "Grok",     "tier": "premium"},
]


def _build_agent(agent_id: str, user_key: str | None):
    """Create an agent instance. Free agents use server keys; premium fall back to env for dev."""
    if agent_id == "llama":
        from backend.agents.groq_agent import GroqAgent
        key = config.GROQ_API_KEY  # always server key
        return GroqAgent(api_key=key) if key else None

    if agent_id == "mistral":
        from backend.agents.mistral_agent import MistralAgent
        key = config.MISTRAL_API_KEY  # always server key
        return MistralAgent(api_key=key) if key else None

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

    if agent_id == "grok":
        from backend.agents.grok_agent import GrokAgent
        key = user_key or config.GROK_API_KEY
        return GrokAgent(api_key=key) if key else None

    return None


# --- Routes ---

@app.get("/api/agents")
async def get_agents():
    """Return agent catalogue with availability and tier."""
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
    api_keys: dict[str, str] = {}   # user-provided keys for premium agents


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
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    yield {"comment": "keep-alive"}
                    continue
                yield {"data": json.dumps(event)}
                if event.get("type") in ("done", "fatal_error"):
                    break
        except asyncio.CancelledError:
            debate_task.cancel()
            raise
        await debate_task

    return EventSourceResponse(event_stream())
