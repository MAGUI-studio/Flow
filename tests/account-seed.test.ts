import { test } from "node:test";
import assert from "node:assert/strict";
import { accountSeedTeams } from "../prisma/account-seed-teams";

test("account seed uses three distinct teams with twenty unique professionals each", () => {
  assert.equal(accountSeedTeams.length, 3);
  for (const team of accountSeedTeams) assert.equal(team.length, 20);
  assert.equal(new Set(accountSeedTeams.flat()).size, 60);
});
