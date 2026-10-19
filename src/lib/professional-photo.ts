import sharp from "sharp";
export const photoMaxBytes = 1024 * 1024;
export async function prepareProfessionalPhoto(bytes: Buffer, mime: string) {
  if (
    !bytes.length ||
    bytes.length > photoMaxBytes ||
    !["image/png", "image/webp"].includes(mime)
  )
    throw new Error("INVALID_PHOTO");
  try {
    const image = sharp(bytes, {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const meta = await image.metadata();
    if (
      !meta.width ||
      !meta.height ||
      (meta.pages ?? 1) > 1 ||
      !["png", "webp"].includes(meta.format ?? "") ||
      `image/${meta.format}` !== mime
    )
      throw new Error();
    return await image
      .rotate()
      .resize(640, 640, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new Error("INVALID_PHOTO");
  }
}
