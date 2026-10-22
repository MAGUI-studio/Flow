import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSuperAdmin,
  authorizeAdmin,
  type AdminIdentity,
} from "../src/lib/admin-policy";
import { adminActionSchema } from "../src/lib/admin-form";

const identity = (): AdminIdentity => ({
  id: "user_owner",
  primaryEmailAddressId: "email_primary",
  emailAddresses: [
    {
      id: "email_primary",
      emailAddress: "guibus.dev@gmail.com",
      verification: { status: "verified" },
    },
  ],
});

test("only the designated verified primary identity receives SUPERADMIN access", () => {
  assert.equal(isSuperAdmin(identity()), true);
  const normalized = identity();
  normalized.emailAddresses[0].emailAddress = "GUIBUS.DEV@gmail.com";
  assert.equal(isSuperAdmin(normalized), true);
  for (const address of [
    "other@gmail.com",
    "guibus.dev+admin@gmail.com",
    "guibusdev@gmail.com",
    "guibus.dev@gmail.com.attacker.test",
  ]) {
    const user = identity();
    user.emailAddresses[0].emailAddress = address;
    assert.equal(isSuperAdmin(user), false);
  }
  const unverified = identity();
  unverified.emailAddresses[0].verification = { status: "unverified" };
  assert.equal(isSuperAdmin(unverified), false);
  const secondary = identity();
  secondary.primaryEmailAddressId = "different";
  assert.equal(isSuperAdmin(secondary), false);
  assert.equal(isSuperAdmin({ ...identity(), banned: true }), false);
  assert.equal(isSuperAdmin({ ...identity(), locked: true }), false);
  assert.equal(isSuperAdmin(null), false);
  assert.equal(isSuperAdmin({ ...identity(), emailAddresses: [] }), false);
});

test("admin authorization binds the verified identity to the authenticated user and fails closed", async () => {
  let reads = 0;
  await assert.rejects(
    authorizeAdmin(null, async () => {
      reads++;
      return identity();
    }),
    /ADMIN_FORBIDDEN/,
  );
  assert.equal(reads, 0);
  await assert.rejects(
    authorizeAdmin("user_attacker", async () => identity()),
    /ADMIN_FORBIDDEN/,
  );
  const ordinary = identity();
  ordinary.emailAddresses[0].emailAddress = "customer@example.com";
  await assert.rejects(
    authorizeAdmin(ordinary.id, async () => ordinary),
    /ADMIN_FORBIDDEN/,
  );
  await assert.rejects(
    authorizeAdmin(identity().id, async () => {
      throw new Error("provider unavailable");
    }),
    /provider unavailable/,
  );
  assert.equal(
    (
      await authorizeAdmin(identity().id, async (id) => {
        assert.equal(id, "user_owner");
        return identity();
      })
    ).id,
    "user_owner",
  );
});

test("administrative changes require an explicit action, target, reason and confirmation", () => {
  const action = {
    action: "ban",
    target: "user_customer",
    reason: "Solicitação administrativa de suporte",
    confirmed: true,
  };
  assert.equal(adminActionSchema.safeParse(action).success, true);
  for (const override of [
    { confirmed: false },
    { reason: "" },
    { reason: "curto" },
    { target: "../user" },
    { action: "grant_admin" },
    { action: "delete" },
  ]) {
    assert.equal(
      adminActionSchema.safeParse({ ...action, ...override }).success,
      false,
    );
  }
});
