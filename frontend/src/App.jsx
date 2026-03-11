import { useEffect, useState, useCallback, useRef } from 'react'
import { useSSE } from './hooks/useSSE'
import DebateView from './components/DebateView'
import SynthesisPanel from './components/SynthesisPanel'
import ResonantLogo from './components/ResonantLogo'
import LLMButton from './components/LLMButton'
import { AgentIcon, IconCog, IconCheck } from './components/LLMIcons'
import IntroScreen from './screens/IntroScreen'
import APIsScreen from './screens/APIsScreen'

const PHASE_ORDER = ['brainstorm', 'critique', 'rebuttal', 'synthesis']

const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u07C0-\u07FF]/
function isRTL(text) {
  if (!text) return false
  const letters = text.match(/\p{L}/gu) || []
  if (letters.length === 0) return false
  const rtlCount = letters.filter(c => RTL_RE.test(c)).length
  return rtlCount / letters.length > 0.3
}

const SUGGESTIONS = [
  'Will AI accelerate geopolitical fragmentation?',
  'Post-AGI economic models',
  'Climate tipping points & governance',
  'The future of democratic institutions',
]

const STATIC_AGENTS = [
  { id: 'claude',  name: 'Claude',  tier: 'premium' },
  { id: 'gpt4',    name: 'ChatGPT', tier: 'premium' },
  { id: 'gemini',  name: 'Gemini',  tier: 'premium' },
  { id: 'grok',    name: 'Grok',    tier: 'premium' },
  { id: 'llama',   name: 'Llama',   tier: 'free' },
  { id: 'mistral', name: 'Mistral', tier: 'free' },
]

function PhaseBar({ currentPhase, rounds }) {
  const phases = ['brainstorm']
  if (rounds >= 3) phases.push('critique')
  if (rounds >= 4) phases.push('rebuttal')
  phases.push('synthesis')

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-white/[0.05] shrink-0">
      {phases.map((phase, i) => {
        const isDone = PHASE_ORDER.indexOf(currentPhase) > PHASE_ORDER.indexOf(phase)
        const isActive = phase === currentPhase
        return (
          <div key={phase} className="flex items-center gap-3">
            {i > 0 && <div className="w-5 h-px bg-white/[0.07]" />}
            <span
              className="text-[11px] capitalize tracking-wide transition-colors"
              style={{
                color: isActive ? '#B873AE' : isDone ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                transitionDuration: '500ms',
              }}
            >
              {isActive && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-mauve mr-1.5 mb-px animate-pulse_dot" />
              )}
              {phase}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Shared left panel: animation + branding
function LeftPanel() {
  return (
    <div className="relative overflow-hidden shrink-0" style={{ width: '50%' }}>
      <ResonantLogo className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex flex-col justify-center px-12 animate-fadein pointer-events-none">
        <h1
          className="font-bold text-white tracking-tight"
          style={{ fontSize: 'clamp(44px, 6vw, 92px)', lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          MegaMind
        </h1>
        <p className="mt-1 text-white font-medium" style={{ fontSize: 'clamp(18px, 2.2vw, 40px)', opacity: 0.9 }}>
          AI think tank
        </p>
        <p className="mt-0.5 text-white font-light" style={{ fontSize: 'clamp(11px, 1.3vw, 20px)', opacity: 0.5 }}>
          Multi model debate
        </p>
      </div>
    </div>
  )
}

// Main input panel for the "clean" and "typing" states
function MainInputArea({
  agents, activeIds, onToggleAgent,
  prompt, onPromptChange, onStart,
  rounds, onRoundsChange,
  apiKeys,
  showSettings, onToggleSettings,
  onEditAPIs,
  isRunning,
  error, onClearError,
}) {
  const [synthesisId, setSynthesisId] = useState('')
  const [confirmToggleId, setConfirmToggleId] = useState(null)
  const textareaRef = useRef(null)

  const hasTyped = prompt.trim().length > 0
  const activeCount = activeIds.length
  const canSubmit = hasTyped && activeCount >= 2 && !isRunning

  const effectiveSynthesisId = (synthesisId && activeIds.includes(synthesisId))
    ? synthesisId
    : activeIds[0] ?? ''

  // Only show agents that are active (connected)
  const connectedAgents = agents.filter(a => activeIds.includes(a.id))

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [prompt])

  function handleToggle(id) {
    const isActive = activeIds.includes(id)
    if (isActive && activeCount <= 2) {
      setConfirmToggleId(id)
    } else {
      onToggleAgent(id)
    }
  }

  function handleSubmit() {
    if (!canSubmit) return
    onStart(prompt.trim(), rounds, effectiveSynthesisId)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Menu bar */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: '74px' }}
      >
        <div />

        <div className="flex items-center gap-1">
          {connectedAgents.map(agent => (
            <LLMButton
              key={agent.id}
              agent={agent}
              active={true}
              available={agent.available !== false}
              onClick={() => handleToggle(agent.id)}
            />
          ))}
        </div>

        <button
          onClick={onToggleSettings}
          className="transition-colors"
          style={{
            color: showSettings ? '#B873AE' : 'rgba(255,255,255,0.25)',
            transitionDuration: '500ms',
          }}
          title="Settings"
        >
          <IconCog size={16} />
        </button>
      </div>

      {/* Centered input */}
      <div className="flex-1 flex items-center justify-center px-10 py-6 min-h-0">
        <div className="w-full max-w-[520px] animate-fadein" style={{ animationDelay: '0.1s' }}>
          {/* Input card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#100E10' }}
          >
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent px-6 pt-5 pb-3 text-[18px] text-white/90 focus:outline-none resize-none leading-relaxed font-light overflow-hidden"
              rows={1}
              value={prompt}
              onChange={e => {
                onPromptChange(e.target.value)
                if (e.target.value.length === 1 && showSettings) onToggleSettings()
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              disabled={isRunning}
              placeholder="Ask me anything..."
              style={{ caretColor: '#B873AE', direction: isRTL(prompt) ? 'rtl' : 'ltr', textAlign: isRTL(prompt) ? 'right' : 'left' }}
            />

            {/* Bottom bar — grid trick: animates height without clipping padding */}
            <div style={{ display: 'grid', gridTemplateRows: hasTyped ? '1fr' : '0fr', transition: 'grid-template-rows 400ms ease' }}>
              <div style={{ overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 pt-3 pb-5 gap-3">
                  <button
                    onClick={() => onPromptChange('')}
                    className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                    style={{ background: 'rgb(68,55,66)', transitionDuration: '500ms' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    Clear
                  </button>
                  {activeCount < 2 ? (
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Enable at least 2 models
                    </span>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                      style={{
                        background: canSubmit ? '#B873AE' : 'rgb(68,55,66)',
                        transitionDuration: '500ms',
                      }}
                      onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                      Think
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings tray */}
          <div
            className="overflow-hidden transition-all"
            style={{
              maxHeight: showSettings ? '300px' : '0px',
              opacity: showSettings ? 1 : 0,
              transitionDuration: '500ms',
            }}
          >
            <div
              className="rounded-2xl px-5 py-4 grid grid-cols-2 gap-4 text-[13px] mt-3"
              style={{ background: '#100E10' }}
            >
              <div>
                <p className="mb-2 uppercase tracking-widest text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Rounds
                </p>
                <div className="space-y-2">
                  {[
                    { n: 2, label: 'Quick · 2 rounds' },
                    { n: 3, label: 'Standard · 3 rounds' },
                    { n: 4, label: 'Full · 4 rounds' },
                  ].map(({ n, label }) => (
                    <label key={n} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio" name="rounds" value={n}
                        checked={rounds === n} onChange={() => onRoundsChange(n)}
                        style={{ accentColor: '#B873AE' }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 uppercase tracking-widest text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Synthesizer
                </p>
                <div className="space-y-2">
                  {connectedAgents.map(a => (
                    <label key={a.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio" name="synthesis" value={a.id}
                        checked={effectiveSynthesisId === a.id}
                        onChange={() => setSynthesisId(a.id)}
                        style={{ accentColor: '#B873AE' }}
                      />
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save + Edit APIs — right-aligned pills */}
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button
                  onClick={onToggleSettings}
                  className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                  style={{ background: 'rgb(68,55,66)', transitionDuration: '500ms' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Save
                </button>
                <button
                  onClick={onEditAPIs}
                  className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                  style={{ background: '#B873AE', transitionDuration: '500ms' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  Edit APIs
                </button>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mt-3 rounded-2xl px-5 py-3 flex items-center justify-between animate-fadein"
              style={{ background: 'rgba(220,38,38,0.1)' }}
            >
              <span className="text-[13px]" style={{ color: 'rgba(248,113,113,0.9)' }}>{error}</span>
              <button
                onClick={onClearError}
                className="text-[12px] ml-4 shrink-0 transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions footer — hides when typing */}
      <div
        className="shrink-0 flex items-center justify-center flex-wrap gap-x-3 px-8 border-t overflow-hidden transition-all"
        style={{
          height: hasTyped ? '0px' : '54px',
          opacity: hasTyped ? 0 : 1,
          pointerEvents: hasTyped ? 'none' : 'auto',
          borderColor: 'rgba(255,255,255,0.04)',
          transitionDuration: '500ms',
        }}
      >
        {SUGGESTIONS.map((s, i) => (
          <span key={s} className="flex items-center gap-3">
            {i > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>|</span>
            )}
            <button
              onClick={() => onPromptChange(s)}
              className="text-[12px] whitespace-nowrap transition-colors"
              style={{ color: 'rgba(255,255,255,0.25)', transitionDuration: '500ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
            >
              {s}
            </button>
          </span>
        ))}
      </div>

      {/* Minimum-models confirmation modal */}
      {confirmToggleId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setConfirmToggleId(null)}
        >
          <div
            className="rounded-2xl p-6 animate-fadein"
            style={{ background: '#1a181b', width: '320px', maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white text-[15px] mb-1">Drop below minimum?</p>
            <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              At least 2 models are needed for a debate.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmToggleId(null)}
                className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                style={{ background: 'rgb(68,55,66)', transitionDuration: '300ms' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onToggleAgent(confirmToggleId); setConfirmToggleId(null) }}
                className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                style={{ background: '#B873AE', transitionDuration: '300ms' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Remove anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Active debate right panel
function DebateRightPanel({ agents, activeIds, state, rounds, onReset, onContinue, rtl = false }) {
  const [followUp, setFollowUp] = useState('')
  const followUpRef = useRef(null)
  const activeAgents = agents.filter(a => activeIds.includes(a.id))
  const isDone = state.status === 'done'

  // Auto-grow follow-up textarea
  useEffect(() => {
    const el = followUpRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [followUp])

  function handleContinue() {
    if (!followUp.trim()) return
    onContinue(followUp.trim())
    setFollowUp('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Menu bar */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: '52px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-1">
          {activeAgents.map(agent => (
            <LLMButton
              key={agent.id}
              agent={agent}
              active={true}
              available={agent.available !== false}
              disabled
            />
          ))}
        </div>
        <button
          onClick={onReset}
          className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
          style={{ background: '#B873AE', transitionDuration: '500ms' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          New debate
        </button>
      </div>

      {state.currentPhase && (
        <PhaseBar currentPhase={state.currentPhase} rounds={rounds} />
      )}

      {/* Single scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {activeAgents.length > 0 && (
            <DebateView
              agents={activeAgents}
              phases={state.phases}
              currentPhase={state.currentPhase}
              rtl={rtl}
            />
          )}

          <SynthesisPanel
            synthesis={state.synthesis}
            totalTokens={state.totalTokens}
            totalCostUSD={state.totalCostUSD}
            status={state.status}
            currentPhase={state.currentPhase}
            rtl={rtl}
          />

          {/* Error banner */}
          {state.status === 'error' && state.error && (
            <div
              className="rounded-2xl flex items-center justify-between px-5 py-3 animate-fadein"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}
            >
              <span className="text-[13px]" style={{ color: 'rgba(248,113,113,0.9)' }}>{state.error}</span>
              <button
                onClick={onReset}
                className="text-[12px] ml-4 shrink-0 transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                Stop / Clear
              </button>
            </div>
          )}

          {/* Follow-up input — appears after synthesis is done */}
          {isDone && (
            <div className="rounded-2xl overflow-hidden animate-fadein" style={{ background: '#100E10' }}>
              <textarea
                ref={followUpRef}
                className="w-full bg-transparent px-6 pt-5 pb-3 text-[16px] text-white/90 focus:outline-none resize-none leading-relaxed font-light overflow-hidden"
                rows={1}
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleContinue() } }}
                placeholder="Ask a follow-up..."
                style={{ caretColor: '#B873AE' }}
              />
              <div style={{ display: 'grid', gridTemplateRows: followUp ? '1fr' : '0fr', transition: 'grid-template-rows 400ms ease' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div className="flex items-center justify-end px-5 pt-3 pb-5">
                    <button
                      onClick={handleContinue}
                      className="px-5 py-2 rounded-full text-[13px] text-white transition-all"
                      style={{ background: '#B873AE', transitionDuration: '500ms' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                    >
                      Think
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height: '24px' }} />
        </div>
      </div>
    </div>
  )
}

function gtagPage(path, title) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path, page_title: title })
  }
}

export default function App() {
  // Screen: 'intro' | 'apis' | 'main'
  const [appScreen, setAppScreen] = useState('intro')

  // Agent catalogue from backend (with tier + available flags)
  const [availableAgents, setAvailableAgents] = useState(STATIC_AGENTS)

  // API keys entered by user (premium models)
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('megamind_api_keys') || '{}') } catch { return {} }
  })

  // Which agents are toggled on
  const [activeIds, setActiveIds] = useState([])

  // Debate settings
  const [rounds, setRounds] = useState(2)
  const [debatePrompt, setDebatePrompt] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [apisReturnScreen, setApisReturnScreen] = useState('intro')

  const { state, startDebate, reset } = useSSE()

  // Fetch agent catalogue on mount
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? ''
    fetch(`${apiBase}/api/agents`)
      .then(r => r.json())
      .then(d => {
        const agents = d.agents ?? STATIC_AGENTS
        setAvailableAgents(agents)
        // Don't auto-enable here; handled by screen flow
      })
      .catch(() => {})
  }, [])

  function handleToggleAgent(id) {
    setActiveIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Intro → free tier path: enable free agents only, go to main
  function handleFreeTier() {
    const freeIds = availableAgents
      .filter(a => a.tier === 'free')
      .map(a => a.id)
    setActiveIds(freeIds)
    setAppScreen('main')
    gtagPage('/main', 'Think Tank')
  }

  // Intro → API path: go to APIs screen
  function handleSupplyAPIs() {
    setApisReturnScreen('intro')
    setAppScreen('apis')
    gtagPage('/apis', 'Add APIs')
  }

  // APIs → save keys and go to main
  function handleSaveKeys(keys, enabledIds) {
    setApiKeys(keys)
    try { localStorage.setItem('megamind_api_keys', JSON.stringify(keys)) } catch {}
    setActiveIds(enabledIds)
    setAppScreen('main')
    gtagPage('/main', 'Think Tank')
  }

  function handleStart(p, selectedRounds, synthesisAgentId) {
    setRounds(selectedRounds)
    setShowSettings(false)
    setDebatePrompt(p)
    startDebate(p, activeIds, selectedRounds, synthesisAgentId, apiKeys)
  }

  function handleReset() {
    reset()
    setPrompt('')
  }

  function handleContinue(followUpText) {
    const synthesis = state.synthesis
    const contextualPrompt = synthesis
      ? `[Previous synthesis: ${synthesis}]\n\nFollow-up: ${followUpText}`
      : followUpText
    const synthesisAgentId = activeIds[0] ?? ''
    setDebatePrompt(followUpText)
    startDebate(contextualPrompt, activeIds, rounds, synthesisAgentId, apiKeys)
  }

  const hasDebate = state.status !== 'idle'

  return (
    <div className="h-full flex bg-ink overflow-hidden">
      <LeftPanel />

      {/* Right panel — switches between screens */}
      <div className="flex-1 flex flex-col min-h-0 bg-ink overflow-hidden">

        {/* Intro screen */}
        {appScreen === 'intro' && (
          <IntroScreen
            agents={availableAgents}
            onSupplyAPIs={handleSupplyAPIs}
            onFreeTier={handleFreeTier}
          />
        )}

        {/* APIs screen */}
        {appScreen === 'apis' && (
          <APIsScreen
            agents={availableAgents}
            initialKeys={apiKeys}
            onSave={handleSaveKeys}
            onBack={() => setAppScreen(apisReturnScreen)}
          />
        )}

        {/* Main screen */}
        {appScreen === 'main' && !hasDebate && (
          <MainInputArea
            agents={availableAgents}
            activeIds={activeIds}
            onToggleAgent={handleToggleAgent}
            prompt={prompt}
            onPromptChange={setPrompt}
            onStart={handleStart}
            rounds={rounds}
            onRoundsChange={setRounds}
            apiKeys={apiKeys}
            showSettings={showSettings}
            onToggleSettings={() => setShowSettings(v => !v)}
            onEditAPIs={() => { setApisReturnScreen('main'); setAppScreen('apis') }}
            isRunning={false}
            error={state.status === 'error' ? state.error : null}
            onClearError={reset}
          />
        )}

        {/* Debate screen */}
        {appScreen === 'main' && hasDebate && (
          <DebateRightPanel
            agents={availableAgents}
            activeIds={activeIds}
            state={state}
            rounds={rounds}
            onReset={handleReset}
            onContinue={handleContinue}
            rtl={isRTL(debatePrompt)}
          />
        )}
      </div>

    </div>
  )
}
