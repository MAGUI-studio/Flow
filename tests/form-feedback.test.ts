import { test } from "node:test";
import assert from "node:assert/strict";
import { validationMessages, fieldValuesEqual } from "../src/lib/form-feedback";
import { establishmentSchema, serviceSchema } from "../src/lib/form-schemas";

test("form readiness reports missing fields without treating zero as an empty value", () => {
  const base = {
    name: "Studio",
    slug: "studio",
    category: "Beleza",
    description: "",
    city: "",
    address: "",
    contactPhone: "",
    approvalMode: "automatic",
    cancelNoticeHours: 0,
  };
  assert.deepEqual(validationMessages(establishmentSchema, base), []);
  assert.ok(
    validationMessages(establishmentSchema, {
      ...base,
      name: "",
      category: "",
    }).some((message) => message.startsWith("Nome:")),
  );
  assert.ok(
    validationMessages(establishmentSchema, {
      ...base,
      cancelNoticeHours: "",
    }).some((message) => message.startsWith("Prazo para cancelar:")),
  );
  assert.ok(
    validationMessages(establishmentSchema, {
      ...base,
      addressDetails: { street: "Rua" },
    }).some((message) => message.includes("CEP")),
  );
});
test("service readiness rejects blank required numbers, missing team and price", () => {
  const base = {
    name: "Corte",
    kind: "individual",
    modality: "in_person",
    durationMinutes: 30,
    stepMinutes: 30,
    bufferBefore: 0,
    bufferAfter: 0,
    price: "50,00",
    free: false,
    professionalIds: ["172c629d-78ed-480e-93ed-5d5d4fd89fc1"],
  };
  assert.deepEqual(validationMessages(serviceSchema, base), []);
  for (const field of [
    "durationMinutes",
    "stepMinutes",
    "bufferBefore",
    "bufferAfter",
  ])
    assert.ok(
      validationMessages(serviceSchema, { ...base, [field]: "" }).length > 0,
    );
  assert.ok(
    validationMessages(serviceSchema, {
      ...base,
      professionalIds: [],
      price: "",
    }).length >= 2,
  );
});
test("field change indicators clear after restoring numeric and nested original values", () => {
  assert.equal(fieldValuesEqual(["ana", "bia"], ["bia", "ana"]), true);
  assert.equal(fieldValuesEqual("30", 30), true);
  assert.equal(fieldValuesEqual("", 0), false);
  assert.equal(fieldValuesEqual("31", 30), false);
  assert.equal(
    fieldValuesEqual(
      [{ start: "09:00", end: "18:00" }],
      [{ start: "09:00", end: "18:00" }],
    ),
    true,
  );
  assert.equal(
    fieldValuesEqual([{ start: "10:00" }], [{ start: "09:00" }]),
    false,
  );
});
