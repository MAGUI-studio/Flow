"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HeartIcon,
  CalendarDotsIcon,
  CompassIcon,
  StorefrontIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
export function AccountMenu({ businessAccess }: { businessAccess?: boolean }) {
  const { user } = useUser();
  const userId = user?.id;
  const pathname = usePathname();
  const [access, setAccess] = useState<{
    userId: string;
    active: boolean;
    superAdmin: boolean;
  }>();
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/account/access", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (!controller.signal.aborted)
          setAccess({
            userId: userId!,
            active: result.businessAccess === true,
            superAdmin: result.superAdmin === true,
          });
      } catch {
        if (!controller.signal.aborted)
          setAccess({ userId: userId!, active: false, superAdmin: false });
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [userId, businessAccess, pathname]);
  const canAccessBusiness =
    businessAccess ?? (access?.userId === userId && access?.active === true);
  return (
    <UserButton>
      <UserButton.MenuItems>
        {access?.userId === userId && access?.superAdmin && (
          <UserButton.Link
            label="Administração Flow"
            labelIcon={<ShieldCheckIcon size={16} />}
            href="/admin"
          />
        )}
        <UserButton.Link
          label="Meus agendamentos"
          labelIcon={<CalendarDotsIcon size={16} />}
          href="/agendamentos"
        />
        <UserButton.Link
          label="Meus favoritos"
          labelIcon={<HeartIcon size={16} />}
          href="/favoritos"
        />
        <UserButton.Link
          label="Explorar espaços"
          labelIcon={<CompassIcon size={16} />}
          href="/explorar"
        />
        {canAccessBusiness && (
          <UserButton.Link
            label="Painel do negócio"
            labelIcon={<StorefrontIcon size={16} />}
            href="/painel"
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
