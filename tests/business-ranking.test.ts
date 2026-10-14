import { test } from "node:test";
import assert from "node:assert/strict";
import { topRatedBusinessIds } from "../src/lib/business-ranking";
test("global top five uses exact ratings then review count and stable name ordering", () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({
    id: String(i),
    slug: `business-${i}`,
    name: `Business ${i}`,
    rating: 5 - i * 0.1,
    ratingCount: 3,
  }));
  assert.deepEqual([...topRatedBusinessIds(rows)], ["0", "1", "2", "3", "4"]);
  assert.equal(rows[0].id, "0");
  const tie = [
    { id: "a", name: "Beta", slug: "beta", rating: 4.5, ratingCount: 2 },
    { id: "b", name: "Zeta", slug: "zeta", rating: 4.5, ratingCount: 10 },
    { id: "c", name: "Alfa", slug: "alfa", rating: 4.5, ratingCount: 2 },
  ];
  assert.deepEqual([...topRatedBusinessIds(tie)], ["b", "c", "a"]);
});
test("unrated businesses do not receive a badge while a genuine zero rating can rank", () => {
  assert.deepEqual(
    [
      ...topRatedBusinessIds([
        {
          id: "empty",
          name: "Empty",
          slug: "empty",
          rating: null,
          ratingCount: 0,
        },
        { id: "zero", name: "Zero", slug: "zero", rating: 0, ratingCount: 1 },
        {
          id: "invalid",
          name: "Invalid",
          slug: "invalid",
          rating: 5,
          ratingCount: 0,
        },
      ]),
    ],
    ["zero"],
  );
});
