import { clerkClient } from "@clerk/nextjs/server";
import type { Prisma } from "@/generated/prisma/client";
export async function customerDirectory(
  tx: Prisma.TransactionClient,
  establishmentId: string,
) {
  const ids = await tx.booking.findMany({
    where: { session: { establishmentId }, purpose: { not: "waitlist" } },
    select: { consumerId: true },
    distinct: ["consumerId"],
    take: 500,
  });
  const users = new Map<string, { id: string; name: string; email: string }>();
  for (const { consumerId } of ids)
    users.set(consumerId, {
      id: consumerId,
      name: `Cliente ${consumerId.slice(-6)}`,
      email: "",
    });
  const clerk = await clerkClient();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const result = await clerk.users.getUserList({
      userId: ids.slice(offset, offset + 100).map((b) => b.consumerId),
      limit: 100,
    });
    for (const user of result.data)
      users.set(user.id, {
        id: user.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "Cliente",
        email:
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress ?? "",
      });
  }
  return [...users.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
