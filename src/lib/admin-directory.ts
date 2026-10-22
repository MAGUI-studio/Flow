import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/backend";
import type { AdminFilters } from "./admin-filters";
import { adminDateRange } from "./admin-filters";
import { isSuperAdmin } from "./admin-policy";
import { requireAdminPage } from "./admin";
import { prisma } from "./prisma";

export async function searchAdminUsers(filters: AdminFilters, all = false) {
  await requireAdminPage();
  const clerk = await clerkClient();
  const range = adminDateRange(filters);
  const users: User[] = [];
  let total = 0;
  do {
    const batch = await clerk.users.getUserList({
      query: filters.busca || undefined,
      limit: 100,
      offset: users.length,
      orderBy:
        filters.ordem === "name"
          ? "+first_name"
          : filters.ordem === "oldest"
            ? "+created_at"
            : "-created_at",
      ...(range.gte ? { createdAtAfter: range.gte.getTime() } : {}),
      ...(range.lt ? { createdAtBefore: range.lt.getTime() } : {}),
    });
    total = batch.totalCount;
    users.push(...batch.data);
    if (!batch.data.length) break;
  } while (all && users.length < total);
  return { users, total };
}

export async function adminUserDirectory(filters: AdminFilters, page: number) {
  await requireAdminPage();
  const size = Number(filters.limite);
  const clerk = await clerkClient();
  const needsFilter = filters.acesso !== "all" || filters.plano !== "all";
  let users: User[];
  let total: number;
  if (needsFilter) {
    ({ users } = await searchAdminUsers(filters, true));
    const plans = new Map<string, string>();
    for (let offset = 0; offset < users.length; offset += 100) {
      const subscriptions = await prisma().subscription.findMany({
        where: {
          ownerId: { in: users.slice(offset, offset + 100).map((u) => u.id) },
        },
        select: { ownerId: true, plan: true },
      });
      subscriptions.forEach((s) => plans.set(s.ownerId, s.plan));
    }
    users = users.filter((user) => {
      const plan = plans.get(user.id) ?? "none";
      return (
        (filters.plano === "all" || plan === filters.plano) &&
        (filters.acesso === "all" ||
          (filters.acesso === "admin" && isSuperAdmin(user)) ||
          (filters.acesso === "banned" && user.banned) ||
          (filters.acesso === "locked" && user.locked) ||
          (filters.acesso === "normal" && !user.banned && !user.locked))
      );
    });
    total = users.length;
    users = users.slice((page - 1) * size, page * size);
  } else {
    const range = adminDateRange(filters);
    const result = await clerk.users.getUserList({
      query: filters.busca || undefined,
      limit: size,
      offset: (page - 1) * size,
      orderBy:
        filters.ordem === "name"
          ? "+first_name"
          : filters.ordem === "oldest"
            ? "+created_at"
            : "-created_at",
      ...(range.gte ? { createdAtAfter: range.gte.getTime() } : {}),
      ...(range.lt ? { createdAtBefore: range.lt.getTime() } : {}),
    });
    users = result.data;
    total = result.totalCount;
  }
  const accounts = users.length
    ? await prisma().account.findMany({
        where: { id: { in: users.map((u) => u.id) } },
        select: {
          id: true,
          subscription: {
            select: { plan: true, status: true, paidUntil: true },
          },
          _count: { select: { establishments: true, bookings: true } },
        },
      })
    : [];
  return { users, total, accounts: new Map(accounts.map((a) => [a.id, a])) };
}
