import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addressSchema,
  optionalAddressSchema,
  formatAddress,
  locationSchema,
} from "../src/lib/address";
test("map coordinates require finite latitude and longitude within geographic bounds", () => {
  assert.equal(locationSchema.safeParse({ latitude: -23.55, longitude: -46.63 }).success, true);
  assert.equal(locationSchema.safeParse({ latitude: 91, longitude: 0 }).success, false);
  assert.equal(locationSchema.safeParse({ latitude: 0, longitude: 181 }).success, false);
  assert.equal(locationSchema.safeParse({ latitude: NaN, longitude: 0 }).success, false);
  assert.equal(locationSchema.safeParse({ latitude: 0 }).success, false);
});
test("online establishments can omit addresses but partial physical addresses are rejected", () => {
  assert.equal(optionalAddressSchema.parse(undefined), undefined);
  assert.equal(
    optionalAddressSchema.parse({
      postalCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    }),
    undefined,
  );
  assert.equal(
    optionalAddressSchema.safeParse({ postalCode: "01001-000" }).success,
    false,
  );
});
test("structured addresses validate Brazilian postal codes, states and building numbers", () => {
  const address = {
    postalCode: "01001-000",
    street: "Praça da Sé",
    number: "S/N",
    complement: "Sala 2",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
  };
  assert.equal(addressSchema.safeParse(address).success, true);
  assert.equal(
    addressSchema.safeParse({ ...address, state: "XX" }).success,
    false,
  );
  assert.equal(
    addressSchema.safeParse({ ...address, number: "" }).success,
    false,
  );
  assert.equal(
    addressSchema.safeParse({ ...address, postalCode: "123" }).success,
    false,
  );
  assert.equal(
    formatAddress(address),
    "Praça da Sé, S/N · Sala 2 · Sé · CEP 01001-000",
  );
});
