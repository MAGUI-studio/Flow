"use client";
import Link from "next/link";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">
        Não conseguimos abrir esta página.
      </h1>
      <p className="mt-4 text-sm leading-7 text-zinc-500">
        Tente novamente. Seus dados salvos continuam na sua conta.
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-zinc-500">
          Referência para suporte: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="button">
          Tentar novamente
        </button>
        <Link href="/agendamentos" className="button secondary">
          Minha área
        </Link>
      </div>
    </main>
  );
}
