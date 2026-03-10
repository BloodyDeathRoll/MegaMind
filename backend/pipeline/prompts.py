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
Review the entire debate history below and produce a synthesis in two parts:

1. SUMMARY (1–2 paragraphs): Open with a direct, plain-language answer to the original question. Capture the consensus and the single most important insight from the debate. No bullet points here — just clear, confident prose.

2. DEEP DIVE: After the summary, break down the details — key themes, trade-offs, priorities, and concrete next steps. Use structure (sections, bullets) as needed.

Do not begin with a heading or label. Start writing the summary immediately."""


def format_responses(responses: list) -> str:
    """Format a list of AgentResponse objects into a readable context block."""
    parts = []
    for r in responses:
        parts.append(f"=== {r.agent_name} ===\n{r.content}")
    return "\n\n".join(parts)


def format_history(history: list[dict]) -> str:
    """Format the full debate history for synthesis context."""
    parts = []
    for entry in history:
        phase = entry["phase"].upper()
        parts.append(f"{'='*40}\n{phase} PHASE\n{'='*40}")
        for r in entry["responses"]:
            parts.append(f"\n{r.agent_name}:\n{r.content}")
    return "\n\n".join(parts)
