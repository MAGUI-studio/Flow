"use client";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { ArrowLink } from "./ui/arrow-link";
export function AccountControls() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-out">
        <ArrowLink href="/entrar">Entrar</ArrowLink>
      </Show>
      <Show when="signed-in">
        <Link href="/agendamentos" className="text-xs">
          Minha conta
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
