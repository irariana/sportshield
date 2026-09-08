function KpiCard({ title, value, meta, icon: Icon, accentClass = 'bg-sky-100 text-sky-700' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentClass}`}>
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400">{meta}</p>
    </div>
  )
}

export default KpiCard
