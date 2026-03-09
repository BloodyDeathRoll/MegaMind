// Agent accent colors — muted but distinct, all harmonize with near-black bg
const AGENT_ACCENT = {
  claude: { border: '#E07B39', text: '#E07B39', bg: 'rgba(224,123,57,0.06)' },
  gpt4:   { border: '#10A37F', text: '#10A37F', bg: 'rgba(16,163,127,0.06)' },
  gemini: { border: '#4285F4', text: '#4285F4', bg: 'rgba(66,133,244,0.06)' },
}
const FALLBACK_ACCENT = { border: '#555', text: '#888', bg: 'rgba(100,100,100,0.06)' }

const PHASE_LABEL = { brainstorm: 'Brainstorm', critique: 'Critique', rebuttal: 'Rebuttal' }

function AgentColumn({ agent, phases, currentPhase }) {
  const accent = AGENT_ACCENT[agent.id] ?? FALLBACK_ACCENT

  const activePhases = Object.entries(phases)
    .filter(([phase]) => phase !== 'synthesis')
    .filter(([, texts]) => texts[agent.id] !== undefined)

  const isStreaming = currentPhase && currentPhase !== 'synthesis'
    && phases[currentPhase]?.[agent.id] !== undefined

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border-t"
      style={{ borderColor: accent.border, background: '#0d0d0d' }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: accent.bg }}
      >
        <span className="text-[13px] font-semibold" style={{ color: accent.text }}>
          {agent.name}
        </span>
        {isStreaming && (
          <span className="flex gap-0.5 items-end h-3">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-current animate-pulse_dot"
                style={{ color: accent.text, height: `${8 + i * 3}px`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activePhases.length === 0 ? (
          <p className="text-[13px] text-[#2a2a2a] italic">Waiting…</p>
        ) : (
          activePhases.map(([phase, texts]) => (
            <div key={phase}>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#444] mb-2">
                {PHASE_LABEL[phase] ?? phase}
              </p>
              <p className="streaming-text text-[#b8b5b0] text-[13px] leading-[1.7]">
                {texts[agent.id]}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function DebateView({ agents, phases, currentPhase }) {
  return (
    <div
      className="flex-1 overflow-hidden grid gap-3 p-4"
      style={{ gridTemplateColumns: `repeat(${agents.length}, 1fr)` }}
    >
      {agents.map(agent => (
        <AgentColumn
          key={agent.id}
          agent={agent}
          phases={phases}
          currentPhase={currentPhase}
        />
      ))}
    </div>
  )
}
