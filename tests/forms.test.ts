import { test } from "node:test";
import assert from "node:assert/strict";
import { phoneMask, currencyMask, currencyCents } from "../src/lib/masks";
import {
  establishmentSchema,
  availabilitySchema,
  serviceSchema,
  bookingSchema,
} from "../src/lib/form-schemas";
test("phone masks handle partial input, landlines, mobile phones, paste and length limits", () => {
  assert.equal(phoneMask(""), "");
  assert.equal(phoneMask("1"), "(1");
  assert.equal(phoneMask("11987654321"), "(11) 98765-4321");
  assert.equal(phoneMask("(11) 3456-7890"), "(11) 3456-7890");
  assert.equal(phoneMask("11987654321999"), "(11) 98765-4321");
});
test("currency masks preserve Brazilian decimals without floating point conversion", () => {
  assert.equal(currencyMask("123450"), "1.234,50");
  assert.equal(currencyCents("1.234,50"), 123450);
  assert.equal(currencyMask(""), "");
});
test("establishment validation requires a category, validates phones and protects reserved slugs", () => {
  const base = {
    name: "Studio",
    slug: "studio",
    category: "Beleza",
    description: "",
    city: "",
    address: "",
    contactPhone: "",
    approvalMode: "manual",
    cancelNoticeHours: 2,
  };
  assert.equal(establishmentSchema.safeParse(base).success, true);
  for (const field of [
    "name",
    "slug",
    "category",
    "approvalMode",
    "cancelNoticeHours",
  ]) {
    assert.equal(
      establishmentSchema.safeParse({ ...base, [field]: "" }).success,
      false,
      `${field} must not accept an empty value`,
    );
  }
  assert.equal(
    establishmentSchema.safeParse({ ...base, cancelNoticeHours: 0 }).success,
    true,
  );
  assert.equal(
    establishmentSchema.safeParse({
      ...base,
      addressDetails: { street: "Rua das Flores" },
    }).success,
    false,
  );
  assert.equal(
    establishmentSchema.safeParse({ ...base, category: "" }).success,
    false,
  );
  assert.equal(
    establishmentSchema.safeParse({ ...base, slug: "painel" }).success,
    false,
  );
  assert.equal(
    establishmentSchema.safeParse({ ...base, slug: "criar-conta" }).success,
    false,
  );
  assert.equal(
    establishmentSchema.safeParse({ ...base, contactPhone: "123" }).success,
    false,
  );
});
test("availability rejects impossible dates and end times before start without limiting future years", () => {
  const base = {
    professionalId: "172c629d-78ed-480e-93ed-5d5d4fd89fc1",
    date: "2027-03-20",
    start: "09:00",
    end: "10:00",
    mode: "open",
  };
  assert.equal(availabilitySchema.safeParse(base).success, true);
  assert.equal(
    availabilitySchema.safeParse({ ...base, date: "2027-02-30" }).success,
    false,
  );
  assert.equal(
    availabilitySchema.safeParse({ ...base, end: "08:00" }).success,
    false,
  );
});
test("services require a professional and a price unless free; online bookings require valid WhatsApp", () => {
  const id = "172c629d-78ed-480e-93ed-5d5d4fd89fc1";
  const service = {
    name: "Yoga",
    kind: "collective",
    modality: "online",
    durationMinutes: 30,
    stepMinutes: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    free: true,
    price: "",
    professionalIds: [id],
  };
  assert.equal(serviceSchema.safeParse(service).success, true);
  assert.equal(
    serviceSchema.safeParse({ ...service, free: false }).success,
    false,
  );
  assert.equal(
    serviceSchema.safeParse({ ...service, professionalIds: [] }).success,
    false,
  );
  const reservation = {
    serviceId: id,
    professionalId: id,
    date: "2027-03-20",
    startsAt: "2027-03-20T12:00:00Z",
    phone: "",
  };
  assert.equal(bookingSchema(false).safeParse(reservation).success, true);
  assert.equal(bookingSchema(true).safeParse(reservation).success, false);
  assert.equal(
    bookingSchema(true).safeParse({ ...reservation, phone: "(11) 98765-4321" })
      .success,
    true,
  );
});
