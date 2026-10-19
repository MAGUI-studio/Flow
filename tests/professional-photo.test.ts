import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  prepareProfessionalPhoto,
  photoMaxBytes,
} from "../src/lib/professional-photo";
test("professional photos reject oversized files, disguised formats and invalid images", async () => {
  await assert.rejects(
    prepareProfessionalPhoto(Buffer.alloc(photoMaxBytes + 1), "image/png"),
    /INVALID_PHOTO/,
  );
  await assert.rejects(
    prepareProfessionalPhoto(Buffer.from("not an image"), "image/png"),
    /INVALID_PHOTO/,
  );
  const jpeg = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  await assert.rejects(
    prepareProfessionalPhoto(jpeg, "image/png"),
    /INVALID_PHOTO/,
  );
});
test("PNG and WEBP photos are normalized into compact square WEBP without metadata", async () => {
  for (const format of ["png", "webp"] as const) {
    const input = await sharp({
      create: { width: 40, height: 80, channels: 3, background: "blue" },
    })
      .toFormat(format)
      .toBuffer();
    const result = await prepareProfessionalPhoto(input, `image/${format}`);
    const meta = await sharp(result).metadata();
    assert.equal(meta.format, "webp");
    assert.equal(meta.width, 640);
    assert.equal(meta.height, 640);
    assert.equal(meta.exif, undefined);
    assert.ok(result.length <= photoMaxBytes);
  }
});
