import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import MetricCard from './components/MetricCard'
import SectionLabel from './components/SectionLabel'
import StatusPanel from './components/StatusPanel'
import useAdminStats, { BASE_URL } from './hooks/useAdminStats'

const DIMENSION_COLORS = ['#17807A', '#2F6FDB', '#6F4EDE', '#BA7517']

function getThemeValue(name, fallback) {
  if (typeof window === 'undefined') return fallback

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function formatLastUpdated(value) {
  if (!value) return 'Waiting for first sync'

  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000))

  if (diffMinutes < 1) return 'Last updated just now'
  if (diffMinutes === 1) return 'Last updated 1 min ago'
  return `Last updated ${diffMinutes} min ago`
}

function ChartCard({ panel, children }) {
  return (
    <section
      className="rounded-[28px] border p-5 shadow-sm"
      style={{
        backgroundColor: 'var(--dashboard-card)',
        borderColor: 'var(--dashboard-divider)',
      }}
    >
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-[var(--dashboard-text)]">{panel.title}</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--dashboard-muted-text)]">{panel.subtitle}</p>
      </div>

      {panel.loading ? (
        <div className="space-y-3">
          <div className="dashboard-skeleton h-4 w-36 rounded-md" />
          <div className="dashboard-skeleton h-[240px] w-full rounded-[22px]" />
        </div>
      ) : panel.error ? (
        <div className="rounded-2xl border border-[#A32D2D]/20 bg-[#A32D2D]/5 px-4 py-3 text-sm text-[#A32D2D]">
          {panel.error}
        </div>
      ) : (
        children
      )}
    </section>
  )
}

function ChartCanvas({ panel, buildConfig, height = 260 }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || panel.loading || panel.error || !panel.labels.length) {
      chartRef.current?.destroy()
      chartRef.current = null
      return undefined
    }

    const theme = {
      text: getThemeValue('--dashboard-text', '#111827'),
      muted: getThemeValue('--dashboard-muted-text', '#6B7280'),
      grid: getThemeValue('--dashboard-grid', 'rgba(148, 163, 184, 0.18)'),
      card: getThemeValue('--dashboard-card', '#FFFFFF'),
      divider: getThemeValue('--dashboard-divider', 'rgba(15, 23, 42, 0.08)'),
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, buildConfig(panel, theme))

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [buildConfig, panel])

  if (!panel.labels.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-[22px] bg-[var(--dashboard-muted-surface)] text-sm text-[var(--dashboard-muted-text)]">
        No data available yet.
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

function buildBarConfig(panel, theme) {
  return {
    type: 'bar',
    data: {
      labels: panel.labels,
      datasets: [
        {
          label: panel.datasets[0]?.label ?? 'Values',
          data: panel.datasets[0]?.data ?? [],
          backgroundColor: DIMENSION_COLORS,
          borderRadius: 10,
          borderSkipped: false,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.card,
          titleColor: theme.text,
          bodyColor: theme.muted,
          borderColor: theme.divider,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.grid },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
      },
    },
  }
}

function buildLatencyConfig(panel, theme) {
  return {
    type: 'line',
    data: {
      labels: panel.labels,
      datasets: [
        {
          label: panel.datasets[0]?.label ?? 'P50 latency',
          data: panel.datasets[0]?.data ?? [],
          borderColor: '#17807A',
          backgroundColor: 'rgba(23, 128, 122, 0.18)',
          tension: 0.35,
          fill: false,
          pointRadius: 3,
        },
        {
          label: panel.datasets[1]?.label ?? 'P95 latency',
          data: panel.datasets[1]?.data ?? [],
          borderColor: '#6F4EDE',
          backgroundColor: 'rgba(111, 78, 222, 0.18)',
          tension: 0.35,
          fill: false,
          pointRadius: 3,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: theme.muted,
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 11 },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.grid },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
      },
    },
  }
}

function buildHeritageConfig(panel, theme) {
  return {
    type: 'line',
    data: {
      labels: panel.labels,
      datasets: [
        {
          label: panel.datasets[0]?.label ?? 'Historic routes',
          data: panel.datasets[0]?.data ?? [],
          borderColor: '#2F6FDB',
          backgroundColor: 'rgba(47, 111, 219, 0.2)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: theme.grid },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 }, precision: 0 },
        },
      },
    },
  }
}

function buildRadarConfig(panel, theme) {
  return {
    type: 'radar',
    data: {
      labels: panel.labels,
      datasets: [
        {
          label: panel.datasets[0]?.label ?? 'Popular routes',
          data: panel.datasets[0]?.data ?? [],
          borderColor: '#2F6FDB',
          backgroundColor: 'rgba(47, 111, 219, 0.18)',
          pointBackgroundColor: '#2F6FDB',
        },
        {
          label: panel.datasets[1]?.label ?? 'All routes',
          data: panel.datasets[1]?.data ?? [],
          borderColor: '#17807A',
          backgroundColor: 'rgba(23, 128, 122, 0.14)',
          pointBackgroundColor: '#17807A',
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: theme.muted,
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 11 },
          },
        },
      },
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          grid: { color: theme.grid },
          angleLines: { color: theme.grid },
          pointLabels: { color: theme.muted, font: { size: 11 } },
          ticks: { display: false },
        },
      },
    },
  }
}

function buildHorizontalBarConfig(panel, theme) {
  return {
    type: 'bar',
    data: {
      labels: panel.labels,
      datasets: [
        {
          label: panel.datasets[0]?.label ?? 'Alignment',
          data: panel.datasets[0]?.data ?? [],
          backgroundColor: DIMENSION_COLORS,
          borderRadius: 999,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: { color: theme.grid },
          border: { display: false },
          ticks: {
            color: theme.muted,
            font: { size: 11 },
            callback: (value) => `${value}%`,
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: theme.muted, font: { size: 11 } },
        },
      },
    },
  }
}

export default function EvaluationDashboard() {
  const {
    authState,
    summaryCards,
    satisfactionChart,
    heritageChart,
    latencyChart,
    radarChart,
    alignmentChart,
    countdownCard,
    dashboardError,
    lastUpdatedAt,
    statusPanel,
    retryAuth,
  } = useAdminStats()

  useEffect(() => {
    document.title = 'Evaluation dashboard | CycleLink'
  }, [])

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] text-[var(--dashboard-text)]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-[var(--dashboard-text)]">
                Evaluation dashboard
              </h1>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
                style={{ backgroundColor: '#3B6D11' }}
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-white" />
                Live
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--dashboard-muted-text)]">
              {formatLastUpdated(lastUpdatedAt)}. Authenticated against <span className="font-medium text-[var(--dashboard-text)]">{BASE_URL}</span>.
            </p>
          </div>

          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              backgroundColor: 'var(--dashboard-card)',
              borderColor: 'var(--dashboard-divider)',
            }}
          >
            <p className="font-medium text-[var(--dashboard-text)]">Admin API session</p>
            <p className="mt-1 text-[var(--dashboard-muted-text)]">
              {authState.loading
                ? 'Signing in with in-memory bearer auth.'
                : authState.error
                  ? authState.error
                  : `Credentials source: ${authState.source}. Refresh is scheduled before expiry.`}
            </p>
          </div>
        </header>

        {(authState.error || dashboardError) && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-[24px] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              backgroundColor: authState.error ? 'rgba(163, 45, 45, 0.06)' : 'rgba(186, 117, 23, 0.08)',
              borderColor: authState.error ? 'rgba(163, 45, 45, 0.18)' : 'rgba(186, 117, 23, 0.18)',
            }}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--dashboard-text)]">
                {authState.error ? 'Admin authentication requires attention' : 'Dashboard loaded with partial data'}
              </p>
              <p className="mt-1 text-sm text-[var(--dashboard-muted-text)]">
                {authState.error || dashboardError}
              </p>
            </div>

            <button
              type="button"
              onClick={retryAuth}
              className="rounded-full bg-[var(--dashboard-text)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Retry session
            </button>
          </div>
        )}

        <div className="space-y-10">
          <section>
            <SectionLabel label="USER ENGAGEMENT" />
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total registered users" {...summaryCards.totalUsers} />
              <MetricCard label="Sign-up trend (30d)" {...summaryCards.signups30d} />
              <MetricCard label="7-day return rate" {...summaryCards.return7d} />
              <MetricCard label="30-day return rate" {...summaryCards.return30d} />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <ChartCard panel={satisfactionChart}>
                <ChartCanvas panel={satisfactionChart} buildConfig={buildBarConfig} />
              </ChartCard>
              <ChartCard panel={heritageChart}>
                <ChartCanvas panel={heritageChart} buildConfig={buildHeritageConfig} />
              </ChartCard>
            </div>
          </section>

          <section>
            <SectionLabel label="SYSTEM PERFORMANCE" />
            <div className="mt-5 space-y-5">
              <StatusPanel {...statusPanel} />
              <ChartCard panel={latencyChart}>
                <ChartCanvas panel={latencyChart} buildConfig={buildLatencyConfig} />
              </ChartCard>
            </div>
          </section>

          <section>
            <SectionLabel label="ROUTING QUALITY" />
            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_360px]">
              <ChartCard panel={radarChart}>
                <ChartCanvas panel={radarChart} buildConfig={buildRadarConfig} />
              </ChartCard>
              <MetricCard label="Ground truth review countdown" {...countdownCard} />
            </div>
            <div className="mt-5">
              <ChartCard panel={alignmentChart}>
                <ChartCanvas panel={alignmentChart} buildConfig={buildHorizontalBarConfig} height={300} />
              </ChartCard>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
