"use client";
import { NotificationCount } from "./ui/notification-count";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BellIcon,
  XIcon,
  CheckIcon,
  CalendarDotsIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ScrollArea } from "./ui/scrollArea";
type Item = {
  id: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
export function NotificationsDrawer() {
  const { isSignedIn, user } = useUser();
  return isSignedIn && user ? <UserNotifications key={user.id} /> : null;
}
function UserNotifications() {
  const { isSignedIn, user } = useUser();
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Item[]>([]),
    [unread, setUnread] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const drawer = useRef<HTMLDivElement>(null),
    overlay = useRef<HTMLDivElement>(null),
    closing = useRef(false);
  const attachDrawer = useCallback((node: HTMLDivElement | null) => {
    drawer.current = node;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    node.animate(
      [
        { transform: "translateX(100%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, []);
  const attachOverlay = useCallback((node: HTMLDivElement | null) => {
    overlay.current = node;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 220,
    });
  }, []);
  async function changeOpen(next: boolean) {
    if (next) {
      setOpen(true);
      return;
    }
    if (closing.current) return;
    closing.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduced && drawer.current) {
      const animation = drawer.current.animate(
        [
          { transform: "translateX(0)", opacity: 1 },
          { transform: "translateX(100%)", opacity: 0 },
        ],
        { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
      );
      overlay.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 220,
        fill: "forwards",
      });
      await animation.finished.catch(() => {});
    }
    setOpen(false);
    closing.current = false;
  }
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) throw Error("Não foi possível carregar suas notificações.");
      const d = await r.json();
      setItems(d.items);
      setUnread(d.unread);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    setItems([]);
    setUnread(0);
    setError("");
    setLoading(true);
    if (!isSignedIn) return;
    void load();
    const id = setInterval(() => {
      if (!document.hidden) void load();
    }, 60000);
    return () => clearInterval(id);
  }, [isSignedIn, user?.id, load]);
  useEffect(() => {
    if (open && isSignedIn) void load();
  }, [open, isSignedIn, load]);
  async function mark(ids?: string[]) {
    setBusy(true);
    try {
      const r = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!r.ok) throw Error("Não foi possível marcar como lida.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  if (!isSignedIn) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(next) => void changeOpen(next)}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
          className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-zinc-900 transition-colors hover:text-[#635BFF] focus-visible:outline-2 focus-visible:outline-[#635BFF] [&>svg]:text-current!"
        >
          <BellIcon size={19} />
          <NotificationCount count={unread} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          ref={attachOverlay}
          className="fixed inset-0 z-[1100] bg-black/30"
        />
        <Dialog.Content
          ref={attachDrawer}
          className="fixed inset-y-0 right-[max(0px,calc((100vw-1760px)/2))] z-[1101] flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 sm:p-6">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight">
                Suas notificações
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-xs leading-5 text-zinc-500">
                Reservas, lembretes e novidades dos seus atendimentos, em um só
                lugar.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fechar notificações"
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            >
              <XIcon size={20} />
            </Dialog.Close>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 text-xs">
            <span className="text-zinc-500">{unread} não lidas</span>
            <button
              type="button"
              disabled={!unread || busy}
              onClick={() => void mark()}
              className="inline-flex items-center gap-1.5 font-medium text-[#635BFF] disabled:opacity-40"
            >
              <CheckIcon size={15} />
              Marcar todas como lidas
            </button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4 sm:p-5">
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl bg-[#F5F4FF] p-4 text-xs text-zinc-700"
                >
                  {error}
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-3 flex items-center gap-2 text-[#635BFF]"
                  >
                    <ArrowClockwiseIcon size={16} />
                    Tentar novamente
                  </button>
                </div>
              )}
              {loading ? (
                <p
                  role="status"
                  className="py-12 text-center text-sm text-zinc-500"
                >
                  Carregando notificações…
                </p>
              ) : !items.length && !error ? (
                <div className="py-16 text-center">
                  <BellIcon
                    size={44}
                    className="mx-auto mb-5 text-[#635BFF]/25"
                  />
                  <p className="font-medium">Tudo em dia por aqui.</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    Seus próximos avisos aparecerão neste espaço.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={`rounded-2xl border p-4 ${n.readAt ? "border-zinc-100 bg-white" : "border-[#e8e5f6] bg-[#F5F4FF]"}`}
                    >
                      <Link
                        href={n.href}
                        onClick={() => {
                          if (!n.readAt) void mark([n.id]);
                          void changeOpen(false);
                        }}
                        className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]"
                      >
                        <div className="flex items-start gap-3">
                          <CalendarDotsIcon
                            size={20}
                            className="mt-0.5 shrink-0 text-[#635BFF]"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-800">
                              {n.title}
                            </p>
                            <p className="mt-2 text-xs leading-6 text-zinc-500">
                              {n.body}
                            </p>
                            <time
                              dateTime={n.createdAt}
                              className="mt-3 block text-[10px] text-zinc-400"
                            >
                              {new Date(n.createdAt).toLocaleString("pt-BR")}
                            </time>
                          </div>
                          {!n.readAt && (
                            <span
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-[#635BFF]"
                              aria-label="Não lida"
                            />
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
          <p className="border-t border-zinc-100 p-5 text-[11px] leading-5 text-zinc-400">
            As notificações são exibidas somente na sua conta Flow.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
