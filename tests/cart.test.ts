import { describe, it, expect } from "vitest";
import { cartTotals, cartWeightGrams } from "@/lib/cart";

describe("cartTotals", () => {
  it("soma quantidade x preço unitário de cada item", () => {
    const total = cartTotals({
      items: [
        { quantity: 2, unitPriceCents: 4990 },
        { quantity: 1, unitPriceCents: 8900 },
      ],
    });
    expect(total).toBe(2 * 4990 + 8900);
  });

  it("carrinho vazio soma zero", () => {
    expect(cartTotals({ items: [] })).toBe(0);
  });
});

describe("cartWeightGrams", () => {
  it("soma o peso total considerando a quantidade de cada item", () => {
    const weight = cartWeightGrams({
      items: [
        { quantity: 2, productVariant: { weightGrams: 250 } },
        { quantity: 1, productVariant: { weightGrams: 1000 } },
      ],
    });
    expect(weight).toBe(2 * 250 + 1000);
  });
});
