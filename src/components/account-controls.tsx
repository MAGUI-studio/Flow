"use client";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
export function AccountControls() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
      <Show when="signed-out">
        <Link className="button small dark" href="/entrar">
          Entrar <span>↗</span>
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/agendamentos" style={{ fontSize: 12 }}>
          Minha conta
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
