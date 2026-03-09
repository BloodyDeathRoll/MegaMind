# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**MegaMind** ("AI Think Tank") is a web app where users submit a question or idea to multiple LLMs that engage in a structured multi-phase debate and produce a synthesized consensus plan. Results stream in real-time via Server-Sent Events (SSE).

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI with asyncio
- **Frontend:** React + Vite + Tailwind CSS
- **Streaming:** SSE (Server-Sent Events)

## Commands

The repo root is `MegaMind/` — `backend/` and `frontend/` are at the top level.

### Backend
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Vite dev server on :5173, proxies /api → :8000
npm run build
npm run lint
```

### Environment

Copy `.env.local.example` → `.env.local` and fill in API keys. `.envrc` (direnv) loads `.env.local` automatically. `backend/config.py` also calls `load_dotenv(".env.local")`.

## Architecture

### Core Design: Plug-in Agent System

All LLM providers implement a single abstract interface (`backend/agents/base.py`):

```python
class AIAgent(ABC):
    @property @abstractmethod
    def agent_id(self) -> str: ...
    @property @abstractmethod
    def agent_name(self) -> str: ...
    @abstractmethod
    async def stream_send(self, system_prompt: str, messages: list[dict], queue: asyncio.Queue, phase: str) -> AgentResponse: ...
```

An `AgentRegistry` manages available agents. New models are added by implementing `AIAgent` — the orchestrator never references specific models directly.

### Debate Pipeline

The orchestrator (`backend/pipeline/orchestrator.py`) runs configurable phases via `asyncio.gather` for parallelism:

| Phase | Temperature | Execution |
|-------|-------------|-----------|
| Brainstorm — agents answer independently | 0.8 | Parallel |
| Critique — agents review each other | 0.6 | Parallel |
| Rebuttal — agents defend or refine | 0.6 | Parallel |
| Synthesis — one agent produces final plan | 0.2 | Single agent |

Default: 4 phases (minimum 2). Phase count is user-configurable.

### SSE Streaming Pattern

The backend streams debate events as SSE. Each event carries: `phase`, `agent_id`, `chunk` (text delta), and `metadata` (token counts, cost). The frontend `useSSE.js` hook consumes this to update the three-column debate view and synthesis panel in real-time.

### Frontend Layout

Three-column live debate view (one column per agent) + synthesis panel below. Agent columns are color-coded; the settings panel lets users choose agents, round count (2–4), synthesis agent, and quick mode.

## Key File: AI-THINKTANK-SPEC.md

The spec contains complete pseudocode, prompt templates, API error handling strategy, token/cost tracking design, and the phased implementation roadmap. Read it before implementing any component.

