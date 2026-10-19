import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { owned } from "./business-write";
import { serviceSchema } from "./form-schemas";
import { currencyCents } from "./masks";
export async function editService(
  tx: Prisma.TransactionClient,
  owner: string,
  id: string,
  input: unknown,
) {
  const data = z.object({ establishmentId: z.string().uuid() }).parse(input);
  const values = serviceSchema.parse(input);
  const business = await owned(tx, owner, data.establishmentId);
  const service = await tx.service.findFirst({
    where: { id, establishmentId: business.id, active: true },
    include: { professionals: true },
  });
  if (!service) throw new Error("INVALID_INPUT");
  const ids = [...new Set(values.professionalIds)];
  const existingIds = service.professionals.map((link) => link.professionalId);
  if (
    (await tx.professional.count({
      where: {
        id: { in: ids },
        establishmentId: business.id,
        deletedAt: null,
        OR: [{ active: true }, { id: { in: existingIds } }],
      },
    })) !== ids.length
  )
    throw new Error("INVALID_INPUT");
  const removed = existingIds.filter((id) => !ids.includes(id));
  if (
    removed.length &&
    (await tx.session.count({
      where: { serviceId: id, professionalId: { in: removed } },
    }))
  )
    throw new Error("SERVICE_PROFESSIONAL_HAS_SESSIONS");
  await tx.professionalService.deleteMany({
    where: { serviceId: id, professionalId: { in: removed } },
  });
  await tx.professionalService.createMany({
    data: ids
      .filter((id) => !existingIds.includes(id))
      .map((professionalId) => ({
        professionalId,
        serviceId: id,
        establishmentId: business.id,
      })),
  });
  return tx.service.update({
    where: { id },
    data: {
      name: values.name,
      kind: values.kind,
      modality: values.modality,
      durationMinutes: values.durationMinutes,
      stepMinutes: values.stepMinutes,
      bufferBefore: values.bufferBefore,
      bufferAfter: values.bufferAfter,
      priceCents: values.free ? 0 : currencyCents(values.price),
    },
  });
}
