import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-tint flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
          <Compass className="w-6 h-6 text-brand" />
        </div>
        <h1 className="font-display text-2xl font-black text-brand-ink mb-1">
          404
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Esta página não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
        >
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
