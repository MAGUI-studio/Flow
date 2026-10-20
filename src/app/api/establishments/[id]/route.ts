import { Prisma } from "@/generated/prisma/client";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { owned, businessBannerUrl } from "@/lib/business-write";
import { establishmentSchema } from "@/lib/form-schemas";
import { formatAddress } from "@/lib/address";
import { revalidatePath } from "next/cache";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await currentUser();
    const { id } = await params;
    const parsed = establishmentSchema.safeParse(await request.json());
    if (!parsed.success) throw new Error("INVALID_INPUT");
    const input = parsed.data;
    const result = await prisma().$transaction(async (tx) => {
      const existing = await owned(tx, owner, id);
      // Public URLs stay stable when the name changes.
      const address = input.addressDetails;
      return tx.establishment.update({
        where: { id },
        data: {
          name: input.name,
          category: input.category,
          description: input.description || null,
          website: input.website || null,
          instagram: input.instagram || null,
          contactPhone: input.contactPhone || null,
          approvalMode: input.approvalMode,
          cancelNoticeHours: input.cancelNoticeHours,
          city: address
            ? `${address.city}, ${address.state}`
            : input.city || null,
          address: address ? formatAddress(address) : input.address || null,
          addressDetails: address ?? Prisma.DbNull,
          coverUrl:
            input.bannerId === undefined
              ? existing.coverUrl
              : await businessBannerUrl(tx, owner, input.bannerId),
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/explorar");
    revalidatePath(`/${result.slug}`);
    revalidatePath("/painel/estabelecimentos");
    return Response.json({ id: result.id });
  } catch (error) {
    return apiError(error);
  }
}
