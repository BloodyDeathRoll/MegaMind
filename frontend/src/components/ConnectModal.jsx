import { useState, useEffect, useRef } from 'react'

const AGENT_META = {
  claude: {
    name: 'Claude',
    color: '#E07B39',
    placeholder: 'sk-ant-…',
    hint: 'Get your key at console.anthropic.com',
  },
  gpt4: {
    name: 'ChatGPT',
    color: '#10A37F',
    placeholder: 'sk-proj-…',
    hint: 'Get your key at platform.openai.com',
  },
  gemini: {
    name: 'Gemini',
    color: '#4285F4',
    placeholder: 'AIzaSy…',
    hint: 'Get your key at aistudio.google.com',
  },
}

export default function ConnectModal({ agentId, currentKey, onSave, onDisconnect, onClose }) {
  const meta = AGENT_META[agentId] ?? AGENT_META.claude
  const [value, setValue] = useState(currentKey ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(agentId, trimmed)
    onClose()
  }

  function handleDisconnect() {
    onDisconnect(agentId)
    onClose()
  }

  function handleKey(e) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: '#1a1720',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
          animation: 'modal-in 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header accent bar */}
        <div className="h-0.5 w-full" style={{ background: meta.color, opacity: 0.8 }} />

        <div className="p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Connect</p>
              <h2 className="text-[18px] font-semibold text-white/90">{meta.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-300"
            >
              ✕
            </button>
          </div>

          {/* Key input */}
          <div className="space-y-2 mb-6">
            <label className="text-[11px] text-white/40 uppercase tracking-wider">API Key</label>
            <input
              ref={inputRef}
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKey}
              placeholder={meta.placeholder}
              className="w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-[13px] text-white/80 placeholder-white/15 focus:outline-none transition-all duration-300"
              style={{
                borderColor: value ? meta.color + '55' : 'rgba(255,255,255,0.08)',
                fontFamily: 'monospace',
              }}
            />
            <p className="text-[11px] text-white/25">{meta.hint}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!value.trim()}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: value.trim() ? meta.color : 'rgba(255,255,255,0.05)',
                color: value.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: value.trim() ? `0 0 20px ${meta.color}40` : 'none',
              }}
            >
              Connect
            </button>
            {currentKey && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl text-[13px] text-white/35 hover:text-red-400 transition-all duration-300"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
