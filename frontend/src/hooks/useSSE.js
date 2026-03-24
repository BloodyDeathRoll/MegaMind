import { useState, useCallback, useRef } from 'react'

const PHASES = ['brainstorm', 'critique', 'rebuttal', 'synthesis']

function initialState() {
  return {
    status: 'idle',        // 'idle' | 'running' | 'done' | 'error'
    currentPhase: null,
    phases: {},            // { brainstorm: { claude: 'text...', gpt4: '...' }, ... }
    synthesis: '',
    totalTokens: 0,
    totalCostUSD: 0,
    agentsDone: {},        // { brainstorm: Set of agent_ids }
    agentErrors: [],
    error: null,
  }
}

export function useSSE() {
  const [state, setState] = useState(initialState)
  const abortRef = useRef(null)

  const startDebate = useCallback(async (prompt, agentIds, rounds, synthesisAgentId, apiKeys = {}) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState(initialState())
    setState(s => ({ ...s, status: 'running', currentPhase: 'brainstorm' }))

    let response
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? ''
      response = await fetch(`${apiBase}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agent_ids: agentIds,
          rounds,
          synthesis_agent_id: synthesisAgentId,
          api_keys: apiKeys,
        }),
        signal: controller.signal,
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(s => ({ ...s, status: 'error', error: 'Failed to connect to server.' }))
      }
      return
    }

    if (!response.ok) {
      setState(s => ({ ...s, status: 'error', error: `Server error: ${response.status}` }))
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event
          try { event = JSON.parse(raw) } catch { continue }

          handleEvent(event)
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(s => ({ ...s, status: 'error', error: 'Connection lost.' }))
      }
    }
  }, [])

  function handleEvent(event) {
    switch (event.type) {
      case 'token': {
        const { phase, agent_id, chunk } = event
        if (phase === 'synthesis') {
          setState(s => ({ ...s, synthesis: s.synthesis + chunk }))
        } else {
          setState(s => ({
            ...s,
            currentPhase: phase,
            phases: {
              ...s.phases,
              [phase]: {
                ...s.phases[phase],
                [agent_id]: (s.phases[phase]?.[agent_id] ?? '') + chunk,
              },
            },
          }))
        }
        break
      }

      case 'agent_done': {
        const { phase, agent_id, input_tokens, output_tokens, cost_usd } = event
        setState(s => ({
          ...s,
          totalTokens: s.totalTokens + (input_tokens + output_tokens),
          totalCostUSD: s.totalCostUSD + cost_usd,
        }))
        break
      }

      case 'phase_done': {
        const { phase } = event
        const nextPhase = PHASES[PHASES.indexOf(phase) + 1] ?? null
        setState(s => ({ ...s, currentPhase: nextPhase }))
        break
      }

      case 'done': {
        setState(s => ({
          ...s,
          status: 'done',
          currentPhase: null,
          totalTokens: event.total_tokens ?? s.totalTokens,
          totalCostUSD: event.total_cost_usd ?? s.totalCostUSD,
          error: s.agentErrors?.length
            ? s.agentErrors.join(' | ')
            : null,
        }))
        break
      }

      case 'fatal_error': {
        setState(s => ({
          ...s,
          status: 'error',
          error: event.message ?? 'Unknown error',
        }))
        break
      }

      case 'error': {
        // Non-fatal: individual agent failed, debate continues.
        // Collect into agentErrors; surface after done.
        setState(s => ({
          ...s,
          agentErrors: [...(s.agentErrors ?? []), event.message ?? 'Unknown error'],
        }))
        break
      }
    }
  }

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setState(initialState())
  }, [])

  return { state, startDebate, reset }
}
