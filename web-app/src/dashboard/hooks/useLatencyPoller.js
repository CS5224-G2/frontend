import { useEffect, useRef, useState } from 'react'

export default function useLatencyPoller({
  enabled = true,
  intervalMs = 30000,
  maxSamples = 7,
  measure,
}) {
  const measureRef = useRef(measure)
  const [state, setState] = useState({
    loading: true,
    error: '',
    samples: [],
    lastSuccessfulAt: null,
  })

  useEffect(() => {
    measureRef.current = measure
  }, [measure])

  useEffect(() => {
    if (!enabled) {
      setState({
        loading: false,
        error: '',
        samples: [],
        lastSuccessfulAt: null,
      })
      return undefined
    }

    let active = true

    const run = async () => {
      try {
        const sample = await measureRef.current?.()
        if (!active || !sample) return

        setState((current) => ({
          loading: false,
          error: '',
          lastSuccessfulAt: sample.timestamp ?? new Date().toISOString(),
          samples: [...current.samples, sample].slice(-maxSamples),
        }))
      } catch (error) {
        if (!active) return
        setState((current) => ({
          ...current,
          loading: current.samples.length === 0,
          error: error instanceof Error ? error.message : 'Latency probe failed.',
        }))
      }
    }

    run()
    const timer = window.setInterval(run, intervalMs)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [enabled, intervalMs, maxSamples])

  return state
}
