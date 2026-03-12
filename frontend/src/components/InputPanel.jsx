import { useState, useRef } from 'react'

const ROUND_LABELS = { 2: 'Quick · 2 rounds', 3: 'Standard · 3 rounds', 4: 'Full · 4 rounds' }

export default function InputPanel({
  rounds,
  onRoundsChange,
  activeIds,
  availableAgents,
  activeCount,
  prompt,
  onPromptChange,
  onStart,
  onReset,
  isRunning,
  showSettings,
}) {
  const [synthesisId, setSynthesisId] = useState('')
  const [isFocused, setIsFocused]     = useState(false)
  const textareaRef = useRef(null)

  const hasTyped  = prompt.trim().length > 0
  const canSubmit = hasTyped && activeCount >= 2 && !isRunning

  // Pick synthesis agent: prefer the stored one if still active, else first active
  const effectiveSynthesisId = (synthesisId && activeIds.includes(synthesisId))
    ? synthesisId
    : activeIds[0] ?? ''

  function handleSubmit(e) {
    e?.preventDefault()
    if (!canSubmit) return
    onStart(prompt.trim(), rounds, effectiveSynthesisId)
  }

  return (
    <div className="w-full space-y-4">
      {/* Input card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl overflow-hidden transition-all duration-500"
        style={{
          background: '#252228',
          border: `1px solid ${isFocused || hasTyped ? 'rgba(184,115,174,0.3)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isFocused || hasTyped ? '0 0 24px rgba(184,115,174,0.08)' : 'none',
        }}
      >
        <textarea
          ref={textareaRef}
          className="w-full bg-transparent px-6 pt-6 pb-4 text-[18px] text-white/90 focus:outline-none resize-none leading-relaxed font-light"
          rows={3}
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e) }}
          disabled={isRunning}
          placeholder="Ask me anything…"
          style={{
            caretColor: '#B873AE',
            '--placeholder-opacity': isFocused || hasTyped ? '0.5' : '0.3',
          }}
        />

        {/* Active model chips */}
        <div className="flex items-center gap-2 px-5 pb-5 pt-1 flex-wrap">
          {availableAgents.filter(a => a.available !== false).map(a => {
            const on = activeIds.includes(a.id)
            return (
              <span
                key={a.id}
                className="text-xs px-3 py-1 rounded-full transition-all duration-300"
                style={{
                  color: on ? 'rgba(184,115,174,0.9)' : 'rgba(255,255,255,0.2)',
                }}
              >
                {a.name}
              </span>
            )
          })}
        </div>
      </form>

      {/* CTA */}
      <div
        className="flex justify-center transition-all duration-500"
        style={{
          opacity: hasTyped || isRunning ? 1 : 0,
          transform: hasTyped || isRunning ? 'translateY(0)' : 'translateY(6px)',
          pointerEvents: hasTyped || isRunning ? 'auto' : 'none',
        }}
      >
        {isRunning ? (
          <button
            type="button"
            onClick={onReset}
            className="px-5 py-[7px] rounded-full text-[13px] transition-all duration-300"
            style={{ color: 'rgba(220,100,100,0.8)' }}
          >
            Stop
          </button>
        ) : activeCount < 2 ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Enable at least 2 models above to start
          </p>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-[7px] rounded-full text-[13px] font-medium transition-all duration-300"
            style={{
              background: 'rgba(184,115,174,0.15)',
              color: '#B873AE',
              boxShadow: '0 0 16px rgba(184,115,174,0.12)',
            }}
          >
            Think →
          </button>
        )}
      </div>

      {/* Settings tray */}
      {showSettings && (
        <div
          className="rounded-xl p-5 grid grid-cols-2 gap-6 text-[13px] animate-fadein"
          style={{ background: '#1e1c20', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-white/25 mb-3 uppercase tracking-widest text-[10px]">Rounds</p>
            <div className="space-y-2.5">
              {[2, 3, 4].map(n => (
                <label key={n} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="rounds" value={n} checked={rounds === n}
                    onChange={() => onRoundsChange(n)} style={{ accentColor: '#B873AE' }} />
                  <span className="text-white/55">{ROUND_LABELS[n]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/25 mb-3 uppercase tracking-widest text-[10px]">Synthesizer</p>
            <div className="space-y-2.5">
              {availableAgents.filter(a => activeIds.includes(a.id)).map(a => (
                <label key={a.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="synthesis" value={a.id}
                    checked={effectiveSynthesisId === a.id}
                    onChange={() => setSynthesisId(a.id)}
                    style={{ accentColor: '#B873AE' }} />
                  <span className="text-white/55">{a.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
