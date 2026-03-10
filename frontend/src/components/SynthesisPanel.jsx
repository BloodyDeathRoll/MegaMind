export default function SynthesisPanel({ synthesis, totalTokens, totalCostUSD, status, currentPhase }) {
  const isSynthesizing = currentPhase === 'synthesis'
  if (!synthesis && !isSynthesizing) return null

  return (
    <div className="rounded-2xl overflow-hidden animate-fadein" style={{ background: '#1a181b' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(184,115,174,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold" style={{ color: '#B873AE' }}>
            Synthesis
          </span>
          {isSynthesizing && (
            <span className="flex gap-0.5 items-end h-3">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-[3px] rounded-full animate-pulse_dot"
                  style={{ background: '#B873AE', height: `${8 + i * 3}px`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </span>
          )}
        </div>
        {status === 'done' && (
          <div className="flex items-center gap-5 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <span>{totalTokens.toLocaleString()} tokens</span>
            <span>${totalCostUSD.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="streaming-text text-[18px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.82)' }}>
          {synthesis}
        </p>
      </div>
    </div>
  )
}
