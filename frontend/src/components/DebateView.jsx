import ReactMarkdown from 'react-markdown'

const AGENT_ACCENT = {
  claude:  { text: '#E07B39', bg: 'rgba(224,123,57,0.07)' },
  gpt4:    { text: '#10A37F', bg: 'rgba(16,163,127,0.07)' },
  gemini:  { text: '#4285F4', bg: 'rgba(66,133,244,0.07)' },
  grok:    { text: '#aaaaaa', bg: 'rgba(170,170,170,0.07)' },
  llama:   { text: '#f97316', bg: 'rgba(249,115,22,0.07)' },
  mistral: { text: '#b06af0', bg: 'rgba(176,106,240,0.07)' },
}
const FALLBACK_ACCENT = { text: '#888', bg: 'rgba(100,100,100,0.07)' }
const PHASE_LABEL = { brainstorm: 'Brainstorm', critique: 'Critique', rebuttal: 'Rebuttal' }

const mdComponents = {
  p:      ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  ul:     ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li:     ({ children }) => <li>{children}</li>,
  h1:     ({ children }) => <p className="font-semibold text-white/90 mb-2">{children}</p>,
  h2:     ({ children }) => <p className="font-semibold text-white/90 mb-2">{children}</p>,
  h3:     ({ children }) => <p className="font-semibold text-white/85 mb-1">{children}</p>,
}

function AgentCard({ agent, phases, currentPhase }) {
  const accent = AGENT_ACCENT[agent.id] ?? FALLBACK_ACCENT

  const activePhases = Object.entries(phases)
    .filter(([phase]) => phase !== 'synthesis')
    .filter(([, texts]) => texts[agent.id] !== undefined)

  const isStreaming = currentPhase && currentPhase !== 'synthesis'
    && phases[currentPhase]?.[agent.id] !== undefined

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1a181b' }}>
      {/* Agent header */}
      <div
        className="flex items-center justify-between px-5 py-3"
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
                className="w-[3px] rounded-full animate-pulse_dot"
                style={{ background: accent.text, height: `${8 + i * 3}px`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">
        {activePhases.length === 0 ? (
          <p className="text-[13px] italic" style={{ color: 'rgba(255,255,255,0.12)' }}>Waiting…</p>
        ) : (
          activePhases.map(([phase, texts]) => (
            <div key={phase}>
              {activePhases.length > 1 && (
                <p
                  className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                  style={{ color: accent.text, opacity: 0.7 }}
                >
                  {PHASE_LABEL[phase] ?? phase}
                </p>
              )}
              <div className="streaming-text text-[18px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                <ReactMarkdown components={mdComponents}>
                  {texts[agent.id]}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function DebateView({ agents, phases, currentPhase }) {
  return (
    <div className="space-y-3">
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          phases={phases}
          currentPhase={currentPhase}
        />
      ))}
    </div>
  )
}
