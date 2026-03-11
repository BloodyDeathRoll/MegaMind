import asyncio

from backend.agents.base import AIAgent, AgentResponse
from backend.pipeline.prompts import (
    BRAINSTORM_PROMPT,
    CRITIQUE_PROMPT,
    REBUTTAL_PROMPT,
    SYNTHESIS_PROMPT,
    format_responses,
    format_history,
)


async def _run_phase(
    agents: list[AIAgent],
    system_prompt_template: str,
    messages: list[dict],
    phase: str,
    queue: asyncio.Queue,
) -> list[AgentResponse]:
    """Run all agents in parallel for a single phase. Failed agents are skipped."""

    async def run_single(agent: AIAgent):
        system_prompt = system_prompt_template.format(agent_name=agent.agent_name)
        return await agent.stream_send(system_prompt, messages, queue, phase)

    results = await asyncio.gather(
        *[run_single(a) for a in agents],
        return_exceptions=True,
    )

    responses = []
    for r in results:
        if isinstance(r, AgentResponse):
            responses.append(r)
        # Exceptions were already put in queue by each agent; just skip them here.

    await queue.put({"type": "phase_done", "phase": phase})
    return responses


async def run_debate(
    agents: list[AIAgent],
    user_prompt: str,
    rounds: int,
    synthesis_agent: AIAgent,
    queue: asyncio.Queue,
) -> None:
    """
    Run the full debate pipeline, pushing SSE events to queue.
    rounds: 2 = brainstorm + synthesis
            3 = brainstorm + critique + synthesis
            4 = brainstorm + critique + rebuttal + synthesis
    """
    history: list[dict] = []

    # --- Phase 1: Brainstorm ---
    brainstorm_messages = [{"role": "user", "content": user_prompt}]
    brainstorm_responses = await _run_phase(
        agents, BRAINSTORM_PROMPT, brainstorm_messages, "brainstorm", queue
    )
    history.append({"phase": "brainstorm", "responses": brainstorm_responses})

    if not brainstorm_responses:
        await queue.put({"type": "fatal_error", "message": "All agents failed during brainstorm."})
        return

    # --- Phase 2: Critique (rounds >= 3) ---
    if rounds >= 3:
        critique_context = format_responses(brainstorm_responses)
        critique_messages = [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": critique_context},
        ]
        critique_responses = await _run_phase(
            agents, CRITIQUE_PROMPT, critique_messages, "critique", queue
        )
        history.append({"phase": "critique", "responses": critique_responses})

    # --- Phase 3: Rebuttal (rounds >= 4) ---
    if rounds >= 4:
        full_context = format_history(history)
        rebuttal_messages = [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": full_context},
        ]
        rebuttal_responses = await _run_phase(
            agents, REBUTTAL_PROMPT, rebuttal_messages, "rebuttal", queue
        )
        history.append({"phase": "rebuttal", "responses": rebuttal_responses})

    # --- Phase 4: Synthesis (single agent) ---
    synthesis_context = format_history(history)
    synthesis_messages = [
        {"role": "user", "content": f"Original question: {user_prompt}\n\nDebate transcript:\n{synthesis_context}\n\nNow write your synthesis."},
    ]
    synthesis_result = await synthesis_agent.stream_send(
        SYNTHESIS_PROMPT, synthesis_messages, queue, "synthesis"
    )
    await queue.put({"type": "phase_done", "phase": "synthesis"})

    # Compute totals
    all_responses = []
    for entry in history:
        all_responses.extend(entry["responses"])
    if isinstance(synthesis_result, AgentResponse):
        all_responses.append(synthesis_result)

    total_tokens = sum(r.tokens_used for r in all_responses)
    total_cost = sum(r.cost_usd for r in all_responses)

    await queue.put({
        "type": "done",
        "total_tokens": total_tokens,
        "total_cost_usd": round(total_cost, 6),
    })
