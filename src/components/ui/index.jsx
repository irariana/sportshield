export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#E2522B] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-[#E2522B] text-white hover:bg-[#c94522]',
    secondary: 'bg-white text-[#14161A] border border-[#E2E0D8] hover:bg-[#F4F3EF]',
    danger: 'bg-[#C23B30] text-white hover:bg-[#a83228]',
    ghost: 'text-[#14161A] hover:bg-[#E2E0D8]/50',
  }
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Field({ label, error, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">{label}</label>}
      {children}
      {error && <p className="text-xs text-[#C23B30]">{error}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-[#E2E0D8] bg-white px-3 py-2 text-sm text-[#14161A] outline-none transition focus:border-[#E2522B] focus:ring-1 focus:ring-[#E2522B] ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-md border border-[#E2E0D8] bg-white px-3 py-2 text-sm text-[#14161A] outline-none transition focus:border-[#E2522B] focus:ring-1 focus:ring-[#E2522B] ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Badge({ variant = 'success', children, className = '' }) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
    piste: 'bg-[#E2522B]/10 text-[#E2522B] border-[#E2522B]/20',
  }
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${variants[variant] || variants.success} ${className}`}>
      {children}
    </span>
  )
}

export function StatTile({ label, value, hint, badge, className = '' }) {
  return (
    <div className={`rounded-md border border-[#E2E0D8] bg-white p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">{label}</span>
        {badge}
      </div>
      <div className="mt-2 text-3xl font-bold font-['Barlow_Condensed'] tabular-nums text-[#14161A]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[#5B606B]">{hint}</div>}
    </div>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#E2E0D8] pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold font-['Barlow_Condensed'] text-[#14161A]">{title}</h1>
        {description && <p className="text-sm text-[#5B606B]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-md border border-[#E2E0D8] bg-white p-12 text-center">
      <h3 className="text-lg font-semibold font-['Barlow_Condensed'] text-[#14161A]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[#5B606B]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
