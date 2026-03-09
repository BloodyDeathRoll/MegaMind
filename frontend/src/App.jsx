import { useEffect, useState } from 'react'
import { useSSE } from './hooks/useSSE'
import InputPanel from './components/InputPanel'
import DebateView from './components/DebateView'
import SynthesisPanel from './components/SynthesisPanel'
import ResonantLogo from './components/ResonantLogo'
import LLMButton from './components/LLMButton'

const PHASE_ORDER = ['brainstorm', 'critique', 'rebuttal', 'synthesis']

const SUGGESTIONS = [
  'Will AI accelerate geopolitical fragmentation?',
  'Post-AGI economic models',
  'Climate tipping points & governance',
  'The future of democratic institutions',
]

const STATIC_AGENTS = [
  { id: 'claude', name: 'Claude'  },
  { id: 'gpt4',   name: 'ChatGPT' },
  { id: 'gemini', name: 'Gemini'  },
]

function CogIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  )
}

function PhaseBar({ currentPhase, rounds }) {
  const phases = ['brainstorm']
  if (rounds >= 3) phases.push('critique')
  if (rounds >= 4) phases.push('rebuttal')
  phases.push('synthesis')

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-white/[0.05] shrink-0">
      {phases.map((phase, i) => {
        const isDone   = PHASE_ORDER.indexOf(currentPhase) > PHASE_ORDER.indexOf(phase)
        const isActive = phase === currentPhase
        return (
          <div key={phase} className="flex items-center gap-3">
            {i > 0 && <div className="w-5 h-px bg-white/[0.07]" />}
            <span
              className="text-[11px] capitalize tracking-wide transition-colors duration-500"
              style={{ color: isActive ? '#B873AE' : isDone ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}
            >
              {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-mauve mr-1.5 mb-px animate-pulse_dot" />}
              {phase}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function App() {
  // agents from API (includes `available` flag); fall back to static list
  const [availableAgents, setAvailableAgents] = useState(STATIC_AGENTS)
  const [activeIds, setActiveIds]             = useState([])   // which models are toggled ON
  const [activeAgents, setActiveAgents]       = useState([])   // agents used in current debate
  const [showSettings, setShowSettings]       = useState(false)
  const [rounds, setRounds]                   = useState(4)
  const [prompt, setPrompt]                   = useState('')
  const { state, startDebate, reset }         = useSSE()

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => {
        const agents = d.agents ?? STATIC_AGENTS
        setAvailableAgents(agents)
        // Auto-enable all available agents
        setActiveIds(agents.filter(a => a.available !== false).map(a => a.id))
      })
      .catch(() => {
        // If backend unreachable, enable all static agents
        setActiveIds(STATIC_AGENTS.map(a => a.id))
      })
  }, [])

  function toggleAgent(id) {
    setActiveIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleStart(p, selectedRounds, synthesisAgentId) {
    setRounds(selectedRounds)
    const agents = availableAgents.filter(a => activeIds.includes(a.id))
    setActiveAgents(agents)
    setShowSettings(false)
    startDebate(p, activeIds, selectedRounds, synthesisAgentId)
  }

  function handleReset() {
    reset()
    setPrompt('')
  }

  const isRunning    = state.status === 'running'
  const hasDebate    = state.status !== 'idle'
  const hasTyped     = prompt.trim().length > 0
  const activeCount  = activeIds.length

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (!hasDebate) {
    return (
      <div className="h-full flex bg-ink overflow-hidden">

        {/* LEFT — animation + title */}
        <div className="relative overflow-hidden shrink-0" style={{ width: '50%' }}>
          <ResonantLogo className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 flex flex-col justify-center px-12 animate-fadein pointer-events-none">
            <h1
              className="font-bold text-white tracking-tight"
              style={{ fontSize: 'clamp(44px, 6vw, 92px)', lineHeight: 1, whiteSpace: 'nowrap' }}
            >
              MegaMind
            </h1>
            <p className="mt-4 font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 48px)', opacity: 0.9 }}>
              AI think tank
            </p>
            <p className="mt-1 font-bold text-white" style={{ fontSize: 'clamp(22px, 3vw, 48px)', opacity: 0.7 }}>
              Multi-model debate
            </p>
          </div>
        </div>

        <div className="w-px shrink-0 bg-white/[0.07]" />

        {/* RIGHT — header + input + suggestions */}
        <div className="flex-1 flex flex-col min-h-0 bg-ink">

          {/* Header: model toggles (left) + cog (right) */}
          <div
            className="flex items-center justify-between px-6 shrink-0 border-b border-white/[0.06]"
            style={{ height: '52px' }}
          >
            <div className="flex items-center gap-6">
              {availableAgents.map(agent => (
                <LLMButton
                  key={agent.id}
                  agent={agent}
                  active={activeIds.includes(agent.id)}
                  available={agent.available !== false}
                  onClick={() => toggleAgent(agent.id)}
                />
              ))}
            </div>
            <button
              onClick={() => setShowSettings(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-500"
              style={{
                color: showSettings ? '#B873AE' : 'rgba(255,255,255,0.35)',
                background: showSettings ? 'rgba(184,115,174,0.1)' : 'transparent',
              }}
              title="Settings"
            >
              <CogIcon />
            </button>
          </div>

          {/* Centered input */}
          <div className="flex-1 flex items-center justify-center px-10 py-6 min-h-0">
            <div className="w-full max-w-[520px] animate-fadein" style={{ animationDelay: '0.1s' }}>
              <InputPanel
                rounds={rounds}
                onRoundsChange={setRounds}
                activeIds={activeIds}
                availableAgents={availableAgents}
                activeCount={activeCount}
                prompt={prompt}
                onPromptChange={setPrompt}
                onStart={handleStart}
                onReset={handleReset}
                isRunning={isRunning}
                showSettings={showSettings}
              />
            </div>
          </div>

          {/* Suggestions — hides when typing */}
          <div
            className="shrink-0 border-t border-white/[0.04] flex items-center justify-center flex-wrap px-8 transition-all duration-500 overflow-hidden"
            style={{
              height: hasTyped ? '0px' : '48px',
              opacity: hasTyped ? 0 : 1,
              pointerEvents: hasTyped ? 'none' : 'auto',
            }}
          >
            {SUGGESTIONS.map((s, i) => (
              <span key={s} className="flex items-center">
                {i > 0 && <span className="mx-3 text-white/[0.12] text-xs select-none">|</span>}
                <button
                  onClick={() => setPrompt(s)}
                  className="text-[12px] font-light transition-colors duration-300 whitespace-nowrap"
                  style={{ color: 'rgba(255,255,255,0.28)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
                >
                  {s}
                </button>
              </span>
            ))}
          </div>
        </div>

        {state.status === 'error' && (
          <p className="fixed top-4 left-1/2 -translate-x-1/2 text-sm text-red-400 bg-[#111] border border-red-800/40 rounded-lg px-4 py-2 z-40">
            {state.error}
          </p>
        )}
      </div>
    )
  }

  // ── ACTIVE debate ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden bg-ink">
      <div
        className="flex items-center justify-between px-5 shrink-0 border-b border-white/[0.05]"
        style={{ height: '52px' }}
      >
        <div className="flex items-center gap-6">
          {availableAgents.map(agent => (
            <LLMButton
              key={agent.id}
              agent={agent}
              active={activeIds.includes(agent.id)}
              available={agent.available !== false}
              onClick={() => {}}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          {state.status === 'error' && <span className="text-xs text-red-400">{state.error}</span>}
          <button
            onClick={handleReset}
            className="text-[12px] transition-colors duration-300"
            style={{ color: 'rgba(255,255,255,0.28)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)' }}
          >
            New debate
          </button>
        </div>
      </div>

      {state.currentPhase && <PhaseBar currentPhase={state.currentPhase} rounds={rounds} />}

      {activeAgents.length > 0 && (
        <DebateView agents={activeAgents} phases={state.phases} currentPhase={state.currentPhase} />
      )}

      <div className="shrink-0">
        <SynthesisPanel
          synthesis={state.synthesis}
          totalTokens={state.totalTokens}
          totalCostUSD={state.totalCostUSD}
          status={state.status}
          currentPhase={state.currentPhase}
        />
      </div>
    </div>
  )
}
