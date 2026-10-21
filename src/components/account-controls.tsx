"use client";
import { NotificationsDrawer } from "./notifications-drawer";
import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { UserCircleIcon } from "@phosphor-icons/react";
import { AccountMenu } from "./account-menu";
import { ArrowLink } from "./ui/arrow-link";
export function AccountControls() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-out">
        <ArrowLink href="/entrar">Entrar</ArrowLink>
      </Show>
      <Show when="signed-in">
        <NotificationsDrawer />
        <Link
          href="/agendamentos"
          className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-[#635BFF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635BFF]"
        >
          <UserCircleIcon size={16} aria-hidden="true" />
          Minha conta
        </Link>
        <AccountMenu />
      </Show>
    </div>
  );
}
