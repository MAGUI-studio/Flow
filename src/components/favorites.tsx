"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import {
  HeartIcon as Heart,
  CircleNotchIcon as LoaderCircle,
} from "@phosphor-icons/react";
import { notify, useToastError } from "@/components/ui/flow-toaster";
const FavoritesContext = createContext<{
  ids: string[];
  ready: boolean;
  pending: Set<string>;
  toggle: (id: string) => Promise<void>;
}>({ ids: [], ready: false, pending: new Set(), toggle: async () => {} });
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [state, setState] = useState<{
    userId: string;
    ids: string[];
    ready: boolean;
  }>({ userId: "", ids: [], ready: false });
  const [pending, setPending] = useState(new Set<string>());
  const error = useToastError();
  const userId = user?.id ?? "";
  const ids = state.userId === userId ? state.ids : [];
  const ready = state.userId === userId && state.ready;
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    const controller = new AbortController();
    fetch("/api/favorites", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data = await response.json();
        setState({ userId, ids: data.ids, ready: true });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          error(
            "Não foi possível carregar seus favoritos. Atualize a página para tentar novamente.",
          );
      });
    return () => controller.abort();
  }, [userId, isSignedIn, error]);
  async function toggle(id: string) {
    if (!isSignedIn || !ready || pending.has(id)) return;
    const saved = !ids.includes(id);
    setPending((value) => new Set(value).add(id));
    try {
      const response = await fetch("/api/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ establishmentId: id, saved }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notify.success(
        saved
          ? "Estabelecimento adicionado aos favoritos"
          : "Estabelecimento removido dos favoritos",
      );
      setState((value) =>
        value.userId !== userId
          ? value
          : {
              ...value,
              ids: saved
                ? [...value.ids, id]
                : value.ids.filter((item) => item !== id),
            },
      );
    } catch (e) {
      error(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar seus favoritos.",
      );
    } finally {
      setPending((value) => {
        const next = new Set(value);
        next.delete(id);
        return next;
      });
    }
  }
  return (
    <FavoritesContext.Provider value={{ ids, ready, pending, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}
export function FavoriteButton({
  id,
  name,
  className = "",
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const { isSignedIn } = useUser();
  const { ids, ready, pending, toggle } = useContext(FavoritesContext);
  if (!isSignedIn) return null;
  const saved = ids.includes(id);
  return (
    <button
      type="button"
      aria-label={`${saved ? "Remover" : "Salvar"} ${name} ${saved ? "dos" : "nos"} favoritos`}
      title={saved ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={saved}
      disabled={!ready || pending.has(id)}
      onClick={() => void toggle(id)}
      className={`relative z-20 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:border-[#635BFF] hover:text-[#635BFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:cursor-wait ${saved ? "text-[#635BFF]!" : ""} ${className}`}
    >
      {pending.has(id) ? (
        <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          size={18}
          weight={saved ? "fill" : "regular"}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
export function FavoriteList({
  items,
  initialIds,
}: {
  items: { id: string; node: ReactNode }[];
  initialIds: string[];
}) {
  const { ids, ready } = useContext(FavoritesContext);
  const selected = ready ? ids : initialIds;
  const visible = items
    .filter((item) => selected.includes(item.id))
    .sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id));
  return visible.length ? (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((item) => (
        <div key={item.id}>{item.node}</div>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center">
      <Heart
        className="mx-auto mb-4 text-[#635BFF]"
        size={30}
        aria-hidden="true"
      />
      <h2 className="text-lg! tracking-tight">
        Seus próximos lugares favoritos estão por aí.
      </h2>
      <p className="mt-3 text-sm text-zinc-500">
        Toque no coração de um espaço para encontrá-lo aqui.
      </p>
      <a
        href="/explorar"
        className="mt-6 inline-flex rounded-xl bg-[#635BFF] px-5 py-3 text-sm font-medium text-white"
      >
        Explorar espaços
      </a>
    </div>
  );
}
