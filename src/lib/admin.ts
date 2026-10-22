import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import { authorizeAdmin } from "./admin-policy";
import { prisma } from "./prisma";

export async function requireSuperAdmin() {
  const { userId } = await auth();
  const clerk = await clerkClient();
  return authorizeAdmin(userId, (id) => clerk.users.getUser(id));
}

export const requireAdminPage = cache(async () => {
  try {
    return await requireSuperAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_FORBIDDEN")
      notFound();
    throw error;
  }
});

export async function adminAudit(
  actorId: string,
  action: string,
  target: string,
) {
  const db = prisma();
  await db.$transaction(async (tx) => {
    await tx.account.upsert({
      where: { id: actorId },
      create: { id: actorId },
      update: {},
    });
    await tx.auditEvent.create({
      data: { actorId, action: `admin.${action}:${target}` },
    });
  });
}

export function adminName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Sem nome"
  );
}

export function adminEmail(user: {
  primaryEmailAddressId: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
}) {
  return (
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? "Sem e-mail"
  );
}

export const adminDate = (value: Date | number | null | undefined) =>
  value == null
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value));
export const adminMoney = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const adminPageNumber = (value: unknown) =>
  typeof value === "string" && /^\d{1,5}$/.test(value)
    ? Math.max(1, Number(value))
    : 1;

export const adminUser = cache(async (id: string) => {
  await requireAdminPage();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) notFound();
  const clerk = await clerkClient();
  try {
    return await clerk.users.getUser(id);
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    if (
      !(await prisma().account.findUnique({
        where: { id },
        select: { id: true },
      }))
    )
      notFound();
    return null;
  }
});
