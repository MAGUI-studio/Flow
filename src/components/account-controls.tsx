"use client";
import { Show, UserButton } from "@clerk/nextjs";
import { ArrowLink } from "./ui/arrow-link";
export function AccountControls() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-out">
        <ArrowLink href="/entrar">Entrar</ArrowLink>
      </Show>
      <Show when="signed-in">
        <a href="/agendamentos" className="text-xs">
          Minha conta
        </a>
        <UserButton />
      </Show>
    </div>
  );
}
