import { useState } from 'react'
import { AgentIcon, IconCog, IconCheck, IconCopy, IconX, IconEye } from '../components/LLMIcons'

const PREMIUM_AGENTS = [
  { id: 'claude',  name: 'Claude',   label: 'Anthropic API Key',  placeholder: 'sk-ant-...' },
  { id: 'gpt4',    name: 'ChatGPT',  label: 'OpenAI API Key',     placeholder: 'sk-...' },
  { id: 'gemini',  name: 'Gemini',   label: 'Google API Key',     placeholder: 'AIza...' },
  { id: 'grok',    name: 'Grok',     label: 'Grok API Key',       placeholder: 'xai-...' },
]

const FREE_AGENTS = [
  { id: 'llama',   name: 'Llama',    label: 'Groq API Key' },
  { id: 'mistral', name: 'Mistral',  label: 'Mistral API Key' },
]

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative shrink-0 rounded-full transition-all"
      style={{
        width: '32px',
        height: '16px',
        background: enabled ? '#B873AE' : '#18161A',
        border: enabled ? '1px solid rgba(184,115,174,0.6)' : '1px solid rgba(255,255,255,0.08)',
        transitionDuration: '500ms',
      }}
      title={enabled ? 'Disable' : 'Enable'}
    >
      <span
        className="absolute rounded-full transition-all"
        style={{
          width: '12px',
          height: '12px',
          top: '1px',
          left: enabled ? '17px' : '1px',
          background: enabled ? 'white' : '#342D37',
          transitionDuration: '500ms',
        }}
      />
    </button>
  )
}

function APILine({ agent, apiKey, onKeyChange, enabled, onToggle, onRemove, isFree = false }) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasKey = apiKey && apiKey.trim().length > 0

  function handleCopy() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  function maskKey(key) {
    if (!key || key.length < 8) return key
    return key.slice(0, 6) + '•'.repeat(Math.min(key.length - 10, 20)) + key.slice(-4)
  }

  return (
    <div
      className="flex items-center gap-4 transition-all"
      style={{ transitionDuration: '500ms' }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0" style={{ width: '170px' }}>
        <AgentIcon agentId={agent.id} size={14} />
        <span className="text-[14px] text-white/80">{agent.label}</span>
      </div>

      {/* Key input area */}
      <div
        className="flex-1 flex items-center justify-between px-4 rounded-xl transition-all"
        style={{
          background: '#18161A',
          height: '42px',
          border: '1px solid rgba(255,255,255,0.04)',
          transitionDuration: '500ms',
        }}
      >
        {isFree ? (
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Not Needed
          </span>
        ) : (
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey || ''}
            onChange={e => onKeyChange(e.target.value)}
            placeholder={agent.placeholder}
            className="flex-1 bg-transparent text-[13px] text-white/80 focus:outline-none min-w-0 mr-2"
            style={{ caretColor: '#B873AE' }}
          />
        )}

        {/* Icons */}
        <div className="flex items-center gap-3 shrink-0">
          {!isFree && (
            <>
              {hasKey && (
                <button
                  onClick={() => setShowKey(v => !v)}
                  className="transition-colors"
                  style={{
                    color: showKey ? 'rgba(184,115,174,0.8)' : 'rgba(255,255,255,0.25)',
                    transitionDuration: '500ms',
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  <IconEye size={13} />
                </button>
              )}
              {hasKey && (
                <button
                  onClick={handleCopy}
                  className="transition-colors"
                  style={{
                    color: copied ? 'rgba(184,115,174,0.9)' : 'rgba(255,255,255,0.25)',
                    transitionDuration: '500ms',
                  }}
                  title="Copy key"
                >
                  {copied ? <IconCheck size={10} /> : <IconCopy size={13} />}
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="transition-colors hover:text-red-400/70"
                  style={{ color: 'rgba(255,255,255,0.2)', transitionDuration: '500ms' }}
                  title="Remove key"
                >
                  <IconX size={10} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toggle */}
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  )
}

export default function APIsScreen({ agents, initialKeys = {}, onSave, onBack }) {
  const [keys, setKeys] = useState(initialKeys)
  const [enabled, setEnabled] = useState(() => {
    // Free agents start enabled, premium start enabled if key exists
    const init = {}
    FREE_AGENTS.forEach(a => { init[a.id] = true })
    PREMIUM_AGENTS.forEach(a => { init[a.id] = !!(initialKeys[a.id]) })
    return init
  })

  // Filter: only show premium agents that are in the catalogue
  const availablePremium = PREMIUM_AGENTS.filter(a =>
    agents.some(ag => ag.id === a.id)
  )
  const availableFree = FREE_AGENTS.filter(a =>
    agents.some(ag => ag.id === a.id)
  )

  function updateKey(agentId, value) {
    setKeys(prev => ({ ...prev, [agentId]: value }))
    // Auto-enable if key was just entered
    if (value.trim().length > 0) {
      setEnabled(prev => ({ ...prev, [agentId]: true }))
    }
  }

  function toggleEnabled(agentId) {
    setEnabled(prev => ({ ...prev, [agentId]: !prev[agentId] }))
  }

  function removeKey(agentId) {
    setKeys(prev => { const n = { ...prev }; delete n[agentId]; return n })
    setEnabled(prev => ({ ...prev, [agentId]: false }))
  }

  function handleSave() {
    const activeIds = [
      ...availableFree.filter(a => enabled[a.id]).map(a => a.id),
      ...availablePremium.filter(a => enabled[a.id] && keys[a.id]).map(a => a.id),
    ]
    onSave(keys, activeIds)
  }

  const allAgents = agents.slice(0, 3) // show first 3 in menu

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Menu bar */}
      <div className="flex items-center justify-between px-6 shrink-0" style={{ height: '74px' }}>
        <button
          onClick={onBack}
          className="text-[12px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)', transitionDuration: '500ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
        >
          ← Back
        </button>
        <IconCog size={24} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer" style={{ transitionDuration: '500ms' }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-10 py-6 min-h-0 overflow-y-auto">
        <div className="w-full max-w-[640px] animate-fadein">
          <div className="rounded-2xl p-8" style={{ background: '#232024' }}>
            <h2 className="text-white text-[22px] font-medium mb-6">Add your APIs</h2>

            <div className="flex flex-col gap-4">
              {/* Premium agents */}
              {availablePremium.map(agent => (
                <APILine
                  key={agent.id}
                  agent={agent}
                  apiKey={keys[agent.id] || ''}
                  onKeyChange={val => updateKey(agent.id, val)}
                  enabled={enabled[agent.id] || false}
                  onToggle={() => toggleEnabled(agent.id)}
                  onRemove={keys[agent.id] ? () => removeKey(agent.id) : null}
                  isFree={false}
                />
              ))}

              {/* Divider if there are both */}
              {availablePremium.length > 0 && availableFree.length > 0 && (
                <div className="flex items-center gap-4 my-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Free tiers
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}

              {/* Free agents */}
              {availableFree.map(agent => (
                <APILine
                  key={agent.id}
                  agent={agent}
                  apiKey={null}
                  onKeyChange={null}
                  enabled={enabled[agent.id] !== false}
                  onToggle={() => toggleEnabled(agent.id)}
                  onRemove={null}
                  isFree={true}
                />
              ))}

              {/* Save button */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                  style={{ background: '#B873AE', transitionDuration: '500ms' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Save Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="shrink-0 flex items-center justify-center px-8"
        style={{ height: '54px', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Keys are stored locally in your browser and sent securely with each request.
        </p>
      </div>
    </div>
  )
}
