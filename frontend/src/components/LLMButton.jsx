const ICONS = {
  claude: '✺',
  gpt4:   '⊕',
  gemini: '✦',
}

const AGENT_META = {
  claude: { label: 'Claude',   color: '#E07B39', glow: 'rgba(224,123,57,0.18)' },
  gpt4:   { label: 'ChatGPT',  color: '#10A37F', glow: 'rgba(16,163,127,0.18)' },
  gemini: { label: 'Gemini',   color: '#4285F4', glow: 'rgba(66,133,244,0.18)' },
}

export default function LLMButton({ agent, active, available = true, onClick }) {
  const meta = AGENT_META[agent.id] ?? { label: agent.name, color: '#888', glow: 'rgba(136,136,136,0.15)' }
  const icon = ICONS[agent.id] ?? '◉'

  // Not available (backend has no key for this model)
  if (!available) {
    return (
      <span
        className="flex items-center gap-1.5 text-[13px] font-light tracking-wide cursor-not-allowed"
        style={{ color: 'rgba(255,255,255,0.18)' }}
        title={`${meta.label} — not configured`}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        {meta.label}
      </span>
    )
  }

  if (active) {
    return (
      <button
        onClick={onClick}
        title={`${meta.label} active — click to disable`}
        className="flex items-center gap-1.5 text-[13px] font-medium tracking-wide transition-all duration-300"
        style={{ color: meta.color }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>
        {meta.label}
        <span style={{ fontSize: '11px', opacity: 0.85 }}>✓</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      title={`Enable ${meta.label}`}
      className="flex items-center gap-1.5 text-[13px] font-light tracking-wide transition-all duration-300"
      style={{ color: 'rgba(255,255,255,0.38)' }}
      onMouseEnter={e => { e.currentTarget.style.color = meta.color }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
    >
      <span style={{ fontSize: '14px', opacity: 0.6 }}>{icon}</span>
      Connect {meta.label}
    </button>
  )
}
