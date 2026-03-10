import { AgentIcon, IconCheck } from './LLMIcons'
import { useState } from 'react'

// Figma: btn component - pill with icon + name, "Connect" label when off, checkmark when on
export default function LLMButton({ agent, active, available = true, onClick, disabled = false }) {
  const [hovered, setHovered] = useState(false)

  const isClickable = !disabled && onClick

  if (!available) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-full text-[14px] select-none"
        style={{
          color: 'rgba(255,255,255,0.18)',
          cursor: 'not-allowed',
        }}
        title={`${agent.name} — not configured`}
      >
        <AgentIcon agentId={agent.id} size={14} style={{ opacity: 0.3 }} />
        <span>{agent.name}</span>
      </div>
    )
  }

  if (active) {
    return (
      <button
        onClick={isClickable ? onClick : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] transition-all"
        style={{
          color: 'rgba(255,255,255,0.9)',
          background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
          cursor: isClickable ? 'pointer' : 'default',
          transitionDuration: '500ms',
        }}
        title={isClickable ? `${agent.name} active — click to disable` : agent.name}
      >
        <AgentIcon agentId={agent.id} size={14} />
        <span>{agent.name}</span>
        <IconCheck size={10} className="text-white/60" />
      </button>
    )
  }

  // Inactive/not connected
  return (
    <button
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] transition-all"
      style={{
        color: hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        cursor: isClickable ? 'pointer' : 'default',
        transitionDuration: '500ms',
      }}
      title={`Connect ${agent.name}`}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.02em' }}>
        Connect
      </span>
      <AgentIcon agentId={agent.id} size={14} style={{ opacity: 0.4 }} />
      <span>{agent.name}</span>
    </button>
  )
}
