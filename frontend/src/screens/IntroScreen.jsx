import LLMButton from '../components/LLMButton'
import { IconCog } from '../components/LLMIcons'

const SUGGESTIONS = [
  'Will AI accelerate geopolitical fragmentation?',
  'Post-AGI economic models',
  'Climate tipping points & governance',
  'The future of democratic institutions',
]

export default function IntroScreen({ agents, onSupplyAPIs, onFreeTier }) {
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
      <div className="flex-1 flex items-center justify-center px-10 py-6 min-h-0">
        <div className="w-full max-w-[520px] animate-fadein">
          <div
            className="rounded-2xl p-8"
            style={{ background: '#232024' }}
          >
            <p className="text-white text-[18px] mb-6" style={{ opacity: 0.9 }}>
              We can go in one of two ways:
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onSupplyAPIs}
                className="w-full px-6 py-3 rounded-xl text-[16px] text-white text-left transition-all"
                style={{ background: '#342D37', border: '1px solid transparent', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)'; e.currentTarget.style.borderColor = 'rgba(184,115,174,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#342D37'; e.currentTarget.style.borderColor = 'transparent' }}
              >
                Supply APIs
              </button>

              <button
                onClick={onFreeTier}
                className="w-full px-6 py-3 rounded-xl text-[16px] text-white text-left transition-all"
                style={{ background: '#342D37', border: '1px solid transparent', transitionDuration: '500ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)'; e.currentTarget.style.borderColor = 'rgba(184,115,174,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#342D37'; e.currentTarget.style.borderColor = 'transparent' }}
              >
                <span>Use Free Tiers</span>
                <span className="ml-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  (Limited)
                </span>
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
        {SUGGESTIONS.map((s, i) => (
          <span key={s} className="flex items-center gap-3">
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>|</span>}
            <span
              className="text-[12px] whitespace-nowrap"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {s}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
