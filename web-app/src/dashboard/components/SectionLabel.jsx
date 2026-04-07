export default function SectionLabel({ number, title, description }) {
  return (
    <div className="mb-5 mt-10 first:mt-0">
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
          {number}
        </span>
        <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight">{title}</h2>
      </div>
      {description && (
        <p className="text-xs text-slate-400 dark:text-zinc-600 ml-9">{description}</p>
      )}
    </div>
  );
}
