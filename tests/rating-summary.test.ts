import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingSummary } from "../src/components/ui/rating-stars";

test("cards never invent a rating when reviews are absent or the aggregate is invalid", () => {
  for (const props of [
    {},
    { rating: 4.9, count: 0 },
    { rating: null, count: 5 },
    { rating: NaN, count: 1 },
    { rating: Infinity, count: 1 },
    { rating: 6, count: 1 },
  ]) {
    assert.match(
      renderToStaticMarkup(createElement(RatingSummary, props)),
      /Sem avaliações/,
    );
  }
  const zero = renderToStaticMarkup(
    createElement(RatingSummary, { rating: 0, count: 1 }),
  );
  assert.match(zero, /Nota 0,0 de 5, 1 avaliação/);
  assert.doesNotMatch(zero, /Sem avaliações/);
  assert.match(
    renderToStaticMarkup(
      createElement(RatingSummary, { rating: 4.75, count: 2 }),
    ),
    /Nota 4,8 de 5, 2 avaliações/,
  );
});
