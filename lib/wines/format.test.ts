import assert from "node:assert/strict";
import test from "node:test";
import { intersectIds, priceToNumber, toWineView } from "./format";

test("priceToNumber converts nullable Prisma decimal values to numbers", () => {
  assert.equal(priceToNumber(null), null);
  assert.equal(priceToNumber(undefined), null);
  assert.equal(priceToNumber({ toNumber: () => 12500.5 }), 12500.5);
  assert.equal(priceToNumber("9900.25"), 9900.25);
});

test("toWineView exposes the existing snake_case app contract", () => {
  assert.deepEqual(
    toWineView({
      active: true,
      description: "Reserva",
      featured: true,
      id: "wine-id",
      imageUrl: "https://example.com/wine.jpg",
      name: "Malbec",
      priceBox: { toNumber: () => 60000 },
      priceUnit: { toNumber: () => 10000 },
      unitsPerBox: 6,
      winery: "Pascual Toso",
    }),
    {
      active: true,
      description: "Reserva",
      featured: true,
      id: "wine-id",
      image_url: "https://example.com/wine.jpg",
      name: "Malbec",
      price_box: 60000,
      price_unit: 10000,
      units_per_box: 6,
      winery: "Pascual Toso",
    },
  );
});

test("intersectIds keeps ids present in every group", () => {
  assert.deepEqual(intersectIds([["a", "b", "c"], ["b", "c"], ["c", "b"]]), ["b", "c"]);
  assert.deepEqual(intersectIds([["a"], []]), []);
  assert.deepEqual(intersectIds([]), []);
});
