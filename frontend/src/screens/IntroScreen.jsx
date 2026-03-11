import { useState } from 'react'
import LLMButton from '../components/LLMButton'
import { IconCog } from '../components/LLMIcons'

const ALL_SUGGESTIONS = [
  'Will AI accelerate geopolitical fragmentation?',
  'Post-AGI economic models',
  'Climate tipping points & governance',
  'The future of democratic institutions',
  'Can universal basic income scale globally?',
  'Is nuclear energy essential for net-zero?',
  'What replaces nation-states in a multipolar world?',
  'The end of truth in the information age',
  'Will brain-computer interfaces widen inequality?',
  'How should AI be governed — who decides?',
  'What does meaningful work look like post-automation?',
  'Should we colonize Mars before fixing Earth?',
  'The ethics of longevity tech for the wealthy few',
  'Can democracy survive social media?',
  'What happens when AI outsmarts its creators?',
  'Is degrowth economically viable?',
  'The future of cities in an era of remote work',
  'Redesigning education for a world without routine jobs',
  'The geopolitics of rare earth minerals',
  'Will quantum computing break modern encryption?',
  'Is transhumanism the next civil rights frontier?',
  'The role of religion in a post-scarcity world',
  'Can we engineer our way out of climate change?',
  'What does privacy mean in 2040?',
]

function pickSuggestions(n = 4) {
  const pool = [...ALL_SUGGESTIONS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}

export default function IntroScreen({ agents, onSupplyAPIs, onFreeTier }) {
  const [suggestions] = useState(() => pickSuggestions(4))
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Menu bar */}
      <div className="flex items-center justify-between px-6 shrink-0" style={{ height: '74px' }}>
        <div />
        <div className="flex items-center gap-1">
          {agents.filter(a => a.tier === 'free').map(agent => (
            <LLMButton
              key={agent.id}
              agent={agent}
              active={true}
              available={agent.available !== false}
              disabled
            />
          ))}
        </div>
        <IconCog size={16} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer" style={{ transitionDuration: '500ms' }} />
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-6 min-h-0">
        <div className="w-full max-w-[520px] animate-fadein">
          <div className="rounded-2xl p-8" style={{ background: '#232024' }}>
            <div className="flex flex-col items-stretch gap-3">
              <button
                onClick={onFreeTier}
                className="w-full px-6 py-3 rounded-xl text-[16px] text-white transition-all"
                style={{ background: '#342D37', border: '1px solid transparent', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)'; e.currentTarget.style.borderColor = 'rgba(184,115,174,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#342D37'; e.currentTarget.style.borderColor = 'transparent' }}
              >
                Use Free Tiers
                <span className="ml-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>(Limited)</span>
              </button>

              <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>or</p>

              <button
                onClick={onSupplyAPIs}
                className="w-full px-6 py-3 rounded-xl text-[16px] text-white transition-all"
                style={{ background: '#342D37', border: '1px solid transparent', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)'; e.currentTarget.style.borderColor = 'rgba(184,115,174,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#342D37'; e.currentTarget.style.borderColor = 'transparent' }}
              >
                Supply APIs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions footer */}
      <div
        className="shrink-0 flex items-center justify-center flex-wrap gap-x-3 px-8 border-t"
        style={{ height: '54px', borderColor: 'rgba(255,255,255,0.04)' }}
      >
        {suggestions.map((s, i) => (
          <span key={s} className="flex items-center gap-3">
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>|</span>}
            <span className="text-[12px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {s}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
