import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";
import { currentUser, apiError } from "@/lib/access";
import { paidAccount } from "@/lib/business-write";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
const maxBytes = 3 * 1024 * 1024;
export async function POST(request: Request) {
  try {
    const owner = await currentUser();
    await prisma().$transaction((tx) => paidAccount(tx, owner));
    if (Number(request.headers.get("content-length")) > maxBytes + 65536)
      throw new Error("INVALID_INPUT");
    const recent = await prisma().businessBanner.count({
      where: {
        ownerId: owner,
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (recent >= 20)
      return Response.json(
        { error: "Você enviou muitas imagens. Tente novamente mais tarde." },
        { status: 429 },
      );
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > maxBytes ||
      file.type !== "image/webp"
    )
      throw new Error("INVALID_INPUT");
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const meta = await image.metadata();
    if (meta.format !== "webp" || (meta.pages ?? 1) !== 1)
      throw new Error("INVALID_INPUT");
    const bytes = await image
      .rotate()
      .resize(1600, 600, { fit: "cover" })
      .webp({ quality: 88 })
      .toBuffer();
    const ut = new UTApi();
    const result = await ut.uploadFiles(
      new UTFile([new Uint8Array(bytes)], "banner.webp", {
        type: "image/webp",
      }),
    );
    if (result.error)
      return Response.json(
        { error: "Não foi possível enviar o banner. Tente novamente." },
        { status: 502 },
      );
    try {
      const banner = await prisma().businessBanner.create({
        data: { ownerId: owner, url: result.data.ufsUrl, key: result.data.key },
        select: { id: true, url: true },
      });
      return Response.json(banner);
    } catch (error) {
      await ut.deleteFiles(result.data.key).catch(() => {});
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
