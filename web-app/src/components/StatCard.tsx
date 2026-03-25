type Props = {
  label: string
  value: string
  accent?: 'green' | 'amber'
}

export default function StatCard({ label, value, accent = 'green' }: Props) {
  const border = accent === 'amber' ? 'border-l-amber-400' : 'border-l-primary-600'
  return (
    <div className={`bg-white rounded-lg p-4 border-l-4 ${border} shadow-sm`}>
      <p className="text-2xl font-extrabold text-primary-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}
