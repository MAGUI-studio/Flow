"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8">
      <h2 className="m-0! text-xl">Não foi possível carregar estes dados.</h2>
      <p className="my-4 text-sm leading-7 text-zinc-500">
        Confira a conexão com o banco e o Clerk. Nenhum acesso é liberado quando
        a verificação da conta falha.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#635BFF] px-4 py-2 text-xs text-white"
      >
        Tentar novamente
      </button>
    </div>
  );
}
