export default function IntroScreen({ onSupplyAPIs, onFreeTier }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 md:px-10 py-6 min-h-0 overflow-hidden">
      <div className="animate-fadein">
        <div className="flex items-center gap-4">
          <button
            onClick={onFreeTier}
            className="px-6 py-3 rounded-xl text-[16px] text-white transition-all whitespace-nowrap"
            style={{ background: '#342D37', transitionDuration: '500ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#342D37' }}
          >
            Use Free Tiers
            <span className="ml-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>(Limited)</span>
          </button>

          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.2)' }}>or</span>

          <button
            onClick={onSupplyAPIs}
            className="px-6 py-3 rounded-xl text-[16px] text-white transition-all whitespace-nowrap"
            style={{ background: '#342D37', transitionDuration: '500ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,174,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#342D37' }}
          >
            Supply APIs
          </button>
        </div>
      </div>
    </div>
  )
}
