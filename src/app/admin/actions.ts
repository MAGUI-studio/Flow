"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, adminAudit } from "@/lib/admin";
import { isSuperAdmin } from "@/lib/admin-policy";
import { adminActionSchema } from "@/lib/admin-form";
import { prisma } from "@/lib/prisma";
import { reportOperationError } from "@/lib/error-reporting";
import { paidAccount } from "@/lib/business-write";
import { setupState } from "@/lib/business-setup";

export async function performAdminAction(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdmin();
    const parsed = adminActionSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, error: "Confira o motivo e a confirmação da ação." };
    const { action, target, reason } = parsed.data;
    if (action === "ban" || action === "unban") {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(target);
      if (target === actor.id || isSuperAdmin(user))
        return {
          ok: false,
          error: "A conta SUPERADMIN não pode ser bloqueada por esta tela.",
        };
      // Write intent before calling the external provider; failures remain auditable.
      await adminAudit(actor.id, `${action}.requested`, `${target}:${reason}`);
      if (action === "ban") await clerk.users.banUser(target);
      else await clerk.users.unbanUser(target);
      await prisma().$transaction(async (tx) => {
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            action: `admin.${action}:${target}:${reason}`,
          },
        });
      });
      revalidatePath(`/admin/usuarios/${target}`, "layout");
    } else {
      await prisma().$transaction(async (tx) => {
        const business = await tx.establishment.findUnique({
          where: { id: target },
          select: { id: true, ownerId: true, active: true },
        });
        if (!business || !business.active)
          throw new Error("ADMIN_BUSINESS_UNAVAILABLE");
        // Publication uses the same business prerequisites as the owner's flow.
        if (action === "publish") {
          await paidAccount(tx, business.ownerId);
          await tx.$queryRaw`SELECT id FROM establishments WHERE id=${target}::uuid FOR UPDATE`;
          const state = await setupState(tx, target, business.ownerId);
          if (!state.ready) throw new Error("SETUP_INCOMPLETE");
          await tx.establishment.update({
            where: { id: target },
            data: { published: true },
          });
        } else
          await tx.establishment.update({
            where: { id: target },
            data: { published: false },
          });
        await tx.account.upsert({
          where: { id: actor.id },
          create: { id: actor.id },
          update: {},
        });
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            establishmentId: target,
            action: `admin.${action}:${target}:${reason}`,
          },
        });
      });
      revalidatePath("/", "layout");
    }
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ADMIN_FORBIDDEN")
      return { ok: false, error: "Acesso não autorizado." };
    if (/SETUP_INCOMPLETE|FORBIDDEN/.test(message))
      return {
        ok: false,
        error:
          "A publicação exige assinatura válida e cadastro completo do estabelecimento.",
      };
    if (message === "ADMIN_BUSINESS_UNAVAILABLE")
      return { ok: false, error: "Estabelecimento indisponível." };
    const ref = reportOperationError(error, "admin.action");
    return {
      ok: false,
      error: `Não foi possível concluir. Atualize os dados antes de tentar novamente. Referência: ${ref}`,
    };
  }
}
