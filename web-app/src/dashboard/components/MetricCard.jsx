const TONE_STYLES = {
  neutral: {
    borderColor: 'var(--dashboard-divider)',
    deltaColor: 'var(--dashboard-muted-text)',
  },
  positive: {
    borderColor: 'rgba(59, 109, 17, 0.28)',
    deltaColor: '#3B6D11',
  },
  warning: {
    borderColor: 'rgba(186, 117, 23, 0.3)',
    deltaColor: '#BA7517',
  },
  danger: {
    borderColor: 'rgba(163, 45, 45, 0.3)',
    deltaColor: '#A32D2D',
  },
}

export default function MetricCard({
  label,
  value,
  delta,
  loading = false,
  error = '',
  tone = 'neutral',
}) {
  const toneStyle = TONE_STYLES[tone] ?? TONE_STYLES.neutral

  return (
    <article
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        backgroundColor: 'var(--dashboard-muted-surface)',
        borderColor: toneStyle.borderColor,
      }}
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--dashboard-muted-text)]">
        {label}
      </p>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="dashboard-skeleton h-7 w-28 rounded-lg" />
          <div className="dashboard-skeleton h-3 w-36 rounded-md" />
        </div>
      ) : error ? (
        <div className="mt-3 text-sm text-[#A32D2D]">{error}</div>
      ) : (
        <>
          <p className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-[var(--dashboard-text)]">
            {value}
          </p>
          <p className="mt-2 text-[12px] font-medium" style={{ color: toneStyle.deltaColor }}>
            {delta}
          </p>
        </>
      )}
    </article>
  )
}
