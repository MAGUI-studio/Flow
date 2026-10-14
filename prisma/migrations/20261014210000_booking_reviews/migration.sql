CREATE TABLE "reviews" (
  "booking_id" UUID PRIMARY KEY REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  "establishment_score" INTEGER NOT NULL CHECK ("establishment_score" BETWEEN 0 AND 10),
  "professional_score" INTEGER NOT NULL CHECK ("professional_score" BETWEEN 0 AND 10),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
