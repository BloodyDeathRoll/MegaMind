export default function SynthesisPanel({ synthesis, totalTokens, totalCostUSD, status, currentPhase }) {
  const isSynthesizing = currentPhase === 'synthesis'
  if (!synthesis && !isSynthesizing) return null

  return (
    <div className="border-t border-white/[0.05] bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-medium uppercase tracking-widest text-mauve/80">
            Synthesis
          </span>
          {isSynthesizing && (
            <span className="flex gap-0.5 items-end h-3">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-mauve/50 animate-pulse_dot"
                  style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </span>
          )}
        </div>
        {status === 'done' && (
          <div className="flex items-center gap-5 text-[11px] text-[#444]">
            <span>{totalTokens.toLocaleString()} tokens</span>
            <span>${totalCostUSD.toFixed(4)}</span>
          </div>
        )}
      </div>

      <div className="max-h-56 overflow-y-auto px-5 py-4">
        <p className="streaming-text text-[#c8c4be] text-[13px] leading-[1.75]">
          {synthesis}
        </p>
      </div>
    </div>
  )
}
