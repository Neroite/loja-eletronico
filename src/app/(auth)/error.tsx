"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="font-display text-lg font-semibold text-brand-dark mb-1">
          Algo deu errado
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Não foi possível carregar esta página. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
