export default function SectionLabel({ label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--dashboard-muted-text)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--dashboard-divider)]" />
    </div>
  )
}
