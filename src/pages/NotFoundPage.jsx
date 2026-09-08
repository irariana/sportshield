import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Erreur 404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Page introuvable</h1>
        <p className="mt-3 text-sm text-slate-600">
          La page demandée n’existe pas ou a été déplacée.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
