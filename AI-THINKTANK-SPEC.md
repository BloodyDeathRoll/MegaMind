# AI Think Tank — Project Specification

## Overview

A web application where a user submits an idea or question to multiple LLMs which then debate in structured rounds, producing a synthesized consensus plan. Models are plug-ins, not hardcoded — the system is model-agnostic by design.

---

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI
- **Async:** asyncio (parallel model calls via `asyncio.gather`)
- **Frontend:** React + Vite + Tailwind CSS
- **Streaming:** Server-Sent Events (SSE) from backend to frontend
- **Environment:** VS Code on Ubuntu Linux

---

## Project Structure

```
ai-thinktank/
├── backend/
│   ├── main.py                  # FastAPI app, SSE endpoints
│   ├── config.py                # Loads .env, app settings
│   ├── agents/
│   │   ├── base.py              # Abstract AIAgent class (the plug-in interface)
│   │   ├── claude_agent.py      # Anthropic adapter
│   │   ├── openai_agent.py      # OpenAI adapter
│   │   └── gemini_agent.py      # Google adapter
│   ├── pipeline/
│   │   ├── orchestrator.py      # Runs the debate loop (model-agnostic)
│   │   └── prompts.py           # System prompt templates per phase
│   └── registry.py              # Agent registry — discovers and loads plug-ins
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── InputPanel.jsx   # User prompt input + settings
│   │   │   ├── DebateView.jsx   # Three-column live debate display
│   │   │   └── SynthesisPanel.jsx  # Final combined plan
│   │   └── hooks/
│   │       └── useSSE.js        # SSE streaming hook
│   ├── index.html
│   └── package.json
├── .env                         # API keys (never committed)
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Core Design Principle: Plug-in Agent System

**Do NOT hardcode models into the orchestrator.** Every model is a plug-in that implements a common interface. The orchestrator only talks to the interface, never to a specific provider.

### Abstract Base Agent

```python
# backend/agents/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class AgentResponse:
    agent_id: str        # e.g. "claude", "gpt", "gemini"
    agent_name: str      # display name
    content: str         # the response text
    tokens_used: int     # for cost tracking

class AIAgent(ABC):
    """All model plug-ins implement this interface."""

    @property
    @abstractmethod
    def agent_id(self) -> str: ...

    @property
    @abstractmethod
    def agent_name(self) -> str: ...

    @abstractmethod
    async def send(self, system_prompt: str, messages: list[dict]) -> AgentResponse: ...
```

### Agent Registry

```python
# backend/registry.py
class AgentRegistry:
    """Discovers and manages available agent plug-ins."""

    def __init__(self):
        self._agents: dict[str, AIAgent] = {}

    def register(self, agent: AIAgent):
        self._agents[agent.agent_id] = agent

    def get(self, agent_id: str) -> AIAgent:
        return self._agents[agent_id]

    def all(self) -> list[AIAgent]:
        return list(self._agents.values())
```

Adding a new model (Mistral, Grok, local LLMs, etc.) means writing one file that implements `AIAgent` and registering it. Zero changes to the orchestrator.

---

## Debate Pipeline

The orchestrator takes a list of agents from the registry and runs them through configurable phases. It has no knowledge of which specific models it is running.

### Phases

| Phase | What Happens | Temperature |
|-------|-------------|-------------|
| **1. Brainstorm** | All agents answer the user's prompt independently, in parallel | 0.8 (creative) |
| **2. Critique** | Each agent sees all other agents' responses and identifies weaknesses | 0.6 |
| **3. Rebuttal** | Agents defend their ideas or incorporate critiques | 0.6 |
| **4. Synthesis** | One agent (user-selectable) combines everything into a unified plan | 0.2 (precise) |

Rounds are configurable: default 4 (brainstorm + critique + rebuttal + synthesis), minimum 2 (brainstorm + synthesis) for quick mode.

### Orchestrator Pseudocode

```python
# backend/pipeline/orchestrator.py
async def run_debate(agents: list[AIAgent], user_prompt: str, rounds: int = 4):
    history = []

    # Phase 1: Brainstorm (parallel)
    phase1 = await asyncio.gather(*[
        agent.send(BRAINSTORM_PROMPT, [{"role": "user", "content": user_prompt}])
        for agent in agents
    ])
    history.append({"phase": "brainstorm", "responses": phase1})
    yield {"event": "phase_complete", "phase": "brainstorm", "data": phase1}

    if rounds >= 3:
        # Phase 2: Critique (parallel)
        critique_context = format_responses_for_critique(phase1)
        phase2 = await asyncio.gather(*[
            agent.send(CRITIQUE_PROMPT, [
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": critique_context}
            ])
            for agent in agents
        ])
        history.append({"phase": "critique", "responses": phase2})
        yield {"event": "phase_complete", "phase": "critique", "data": phase2}

    if rounds >= 4:
        # Phase 3: Rebuttal (parallel)
        rebuttal_context = format_full_history(history)
        phase3 = await asyncio.gather(*[
            agent.send(REBUTTAL_PROMPT, [
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": rebuttal_context}
            ])
            for agent in agents
        ])
        history.append({"phase": "rebuttal", "responses": phase3})
        yield {"event": "phase_complete", "phase": "rebuttal", "data": phase3}

    # Final: Synthesis (single agent, user-selectable)
    synthesis_agent = agents[0]  # or user's choice
    synthesis_context = format_full_history(history)
    final = await synthesis_agent.send(SYNTHESIS_PROMPT, [
        {"role": "user", "content": user_prompt},
        {"role": "assistant", "content": synthesis_context}
    ])
    yield {"event": "synthesis", "data": final}
```

### Prompt Templates

```python
# backend/pipeline/prompts.py

BRAINSTORM_PROMPT = """You are {agent_name}, participating in a multi-AI think tank.
Answer the following question with your best independent analysis.
Be specific and actionable. Do not hedge."""

CRITIQUE_PROMPT = """You are {agent_name} in a multi-AI think tank.
Below are proposals from other AI participants.
Review each one. Identify strengths, blind spots, and flaws.
Then present your refined position. Be constructive but honest."""

REBUTTAL_PROMPT = """You are {agent_name} in a multi-AI think tank.
The debate has progressed through initial proposals and critiques.
Review the full discussion. Defend your strongest ideas or incorporate
valid critiques. Present your final position."""

SYNTHESIS_PROMPT = """You are the lead synthesizer for this think tank session.
Review the entire debate history below.
Create a single, coherent, actionable plan that incorporates the strongest
elements from all participants. Structure it with clear sections,
priorities, and concrete next steps."""
```

---

## Frontend

### Layout

```
┌─────────────────────────────────────────────────┐
│  [Input Panel]  Type your idea... [Settings] [Go]│
├────────────┬────────────┬───────────────────────┤
│  Agent 1   │  Agent 2   │  Agent 3              │
│  (purple)  │  (green)   │  (blue)               │
│            │            │                       │
│  Phase 1   │  Phase 1   │  Phase 1              │
│  response  │  response  │  response             │
│  ...       │  ...       │  ...                  │
├────────────┴────────────┴───────────────────────┤
│  [Synthesis Panel]                               │
│  Final combined plan displayed here              │
│                                                  │
│  Tokens: 12,450  |  Est. cost: $0.14            │
└─────────────────────────────────────────────────┘
```

### Settings Panel

- Number of rounds (2–4)
- Which agents to include (checkboxes from registry)
- Which agent synthesizes
- Quick mode toggle (2 rounds)

### Streaming

Each agent's column streams tokens in real-time via SSE. All columns fill simultaneously during parallel phases.

---

## API Keys & Security

- All keys in `.env`, loaded via `python-dotenv`
- `.env` added to `.gitignore` on repo init
- Retry logic with exponential backoff per agent
- Graceful degradation: if one agent's API fails, the debate continues with the remaining agents

### .env format

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

---

## Implementation Phases

### Phase 1: Foundation (Day 1–2)
- Init repo with `.env`, `.gitignore`, `requirements.txt`, README
- Implement `AIAgent` base class and `AgentRegistry`
- Build the three initial agent plug-ins (Claude, OpenAI, Gemini)
- Test: send one prompt to all agents, print results to terminal

### Phase 2: Debate Pipeline (Day 3–4)
- Implement orchestrator with all 4 debate phases
- Build prompt templates
- Add token counting and cost tracking
- Test full debate loop via CLI

### Phase 3: Frontend (Day 5–7)
- Scaffold React + Vite app
- Build three-column debate view with SSE streaming
- Build input panel with settings
- Build synthesis panel
- Color-code agents, show cost/token counter

### Phase 4: Hardening (Day 8+)
- Error handling, retry logic, timeout management
- Graceful degradation when an agent API is down
- Session persistence (save/load debates to local JSON or SQLite)
- Clean up UI, responsive layout

---

## Later Enhancements

These are out of scope for MVP but planned for future iterations:

- **Collapsible debate history** — expand/collapse each phase in the UI for cleaner reading
- **Model scoring** — score each agent's responses on dimensions like feasibility, novelty, cost, and risk
- **Disagreement highlighting** — visual indicators where agents diverge significantly
- **AI Personalities** — assign roles to agents to prevent premature convergence. Examples: GPT → Strategist, Claude → Critic, Gemini → Researcher. Roles are configurable per session, not hardcoded.

---

## Dependencies

### Backend (requirements.txt)
```
fastapi
uvicorn[standard]
anthropic
openai
google-generativeai
python-dotenv
sse-starlette
```

### Frontend (package.json)
```
react
react-dom
vite
tailwindcss
@vitejs/plugin-react
```
