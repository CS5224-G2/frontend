function StatusDot({ tone }) {
  const colors = {
    green: '#3B6D11',
    amber: '#BA7517',
    red: '#A32D2D',
  }

  return (
    <span
      aria-hidden="true"
      className="inline-flex h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: colors[tone] ?? colors.green }}
    />
  )
}

function StatusItem({ item }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        backgroundColor: 'var(--dashboard-card)',
        borderColor: 'var(--dashboard-divider)',
      }}
    >
      <div className="flex items-center gap-2">
        <StatusDot tone={item.tone} />
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--dashboard-muted-text)]">
          {item.label}
        </p>
      </div>
      <p className="mt-3 text-lg font-semibold text-[var(--dashboard-text)]">{item.value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[var(--dashboard-muted-text)]">{item.note}</p>
    </div>
  )
}

export default function StatusPanel({ items, loading = false, error = '' }) {
  return (
    <section
      className="rounded-[28px] border p-5 shadow-sm"
      style={{
        backgroundColor: 'var(--dashboard-card)',
        borderColor: 'var(--dashboard-divider)',
      }}
    >
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-[var(--dashboard-text)]">Live system status</p>
        <p className="mt-1 text-[11px] text-[var(--dashboard-muted-text)]">
          30 second probes for latency and freshness, plus session-scoped route scoring health.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--dashboard-muted-surface)',
                borderColor: 'var(--dashboard-divider)',
              }}
            >
              <div className="dashboard-skeleton h-3 w-24 rounded-md" />
              <div className="dashboard-skeleton mt-4 h-6 w-20 rounded-md" />
              <div className="dashboard-skeleton mt-3 h-3 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#A32D2D]/20 bg-[#A32D2D]/5 px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <StatusItem key={item.label} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
