"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
const Context = createContext<(id: string, dirty: boolean) => void>(() => {});
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const entries = useRef(new Set<string>());
  const [href, setHref] = useState<string | null>(null);
  const register = useCallback((id: string, dirty: boolean) => {
    if (dirty) entries.current.add(id);
    else entries.current.delete(id);
  }, []);
  useEffect(() => {
    function unload(e: BeforeUnloadEvent) {
      if (entries.current.size) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    function click(e: MouseEvent) {
      if (
        !entries.current.size ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as Element).closest?.("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (
        url.href === location.href ||
        url.href.split("#")[0] === location.href.split("#")[0]
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setHref(url.href);
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, []);
  return (
    <Context.Provider value={register}>
      {children}
      <Dialog.Root
        open={!!href}
        onOpenChange={(open) => {
          if (!open) setHref(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[1200] bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[1201] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <Dialog.Title className="text-xl font-semibold">
              Sair sem salvar?
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm leading-7 text-zinc-500">
              Você tem alterações que ainda não foram salvas. Ao sair desta
              página, elas serão descartadas.
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close className="button secondary">
                Continuar editando
              </Dialog.Close>
              <button
                type="button"
                className="button"
                onClick={() => {
                  const target = href;
                  setHref(null);
                  entries.current.clear();
                  if (target) {
                    const u = new URL(target);
                    if (u.origin === location.origin)
                      router.push(u.pathname + u.search + u.hash);
                    else location.assign(target);
                  }
                }}
              >
                Descartar e sair
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Context.Provider>
  );
}
export function useUnsavedChanges(dirty: boolean) {
  const id = useId(),
    register = useContext(Context);
  useEffect(() => {
    register(id, dirty);
    return () => register(id, false);
  }, [id, dirty, register]);
}
