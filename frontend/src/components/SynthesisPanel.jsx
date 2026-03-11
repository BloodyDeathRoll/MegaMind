import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const mdComponents = {
  p:      ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white/95">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  ul:     ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>,
  li:     ({ children }) => <li>{children}</li>,
  h1:     ({ children }) => <p className="font-semibold text-white/95 text-[20px] mt-6 mb-2">{children}</p>,
  h2:     ({ children }) => <p className="font-semibold text-white/90 text-[19px] mt-5 mb-2">{children}</p>,
  h3:     ({ children }) => <p className="font-semibold text-[#B873AE]/80 text-[16px] uppercase tracking-wide mt-5 mb-2">{children}</p>,
}

function splitSynthesis(text) {
  if (!text) return { preview: '', rest: '' }
  // Split on double newlines, keep first 2 non-empty blocks as preview
  const blocks = text.split(/\n\n+/)
  const nonEmpty = blocks.filter(b => b.trim().length > 0)
  if (nonEmpty.length <= 2) return { preview: text, rest: '' }
  const preview = nonEmpty.slice(0, 2).join('\n\n')
  const rest = nonEmpty.slice(2).join('\n\n')
  return { preview, rest }
}

export default function SynthesisPanel({ synthesis, totalTokens, totalCostUSD, status, currentPhase, rtl = false }) {
  const [expanded, setExpanded] = useState(false)
  const isSynthesizing = currentPhase === 'synthesis'
  if (!synthesis && !isSynthesizing) return null

  const { preview, rest } = splitSynthesis(synthesis)
  const hasMore = rest.length > 0 && status === 'done'

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
      <div className="streaming-text px-5 py-5 text-[18px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.82)' }} dir={rtl ? 'rtl' : 'ltr'}>
        <ReactMarkdown components={mdComponents}>
          {preview}
        </ReactMarkdown>

        {/* Expandable rest */}
        {hasMore && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: expanded ? '1fr' : '0fr',
                transition: 'grid-template-rows 400ms ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div className="pt-2">
                  <ReactMarkdown components={mdComponents}>
                    {rest}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-3 text-[13px] transition-colors"
              style={{ color: expanded ? 'rgba(184,115,174,0.5)' : '#B873AE', transitionDuration: '300ms' }}
            >
              {expanded ? '↑ less' : '↓ more details'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
