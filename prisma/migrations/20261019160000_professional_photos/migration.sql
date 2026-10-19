CREATE TABLE "professional_photos" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "owner_id" TEXT NOT NULL, "establishment_id" UUID NOT NULL, "url" TEXT NOT NULL, "key" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "professional_photos_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "professional_photos_key_key" ON "professional_photos"("key");
CREATE INDEX "professional_photos_owner_id_establishment_id_idx" ON "professional_photos"("owner_id", "establishment_id");
ALTER TABLE "professionals" ADD COLUMN "photo_id" UUID;
CREATE UNIQUE INDEX "professionals_photo_id_key" ON "professionals"("photo_id");
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "professional_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
