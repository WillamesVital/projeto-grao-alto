import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  resolveOwnFleetShipping,
  resolveCorreiosShipping,
  resolvePickupShipping,
  quoteDeliveryOptions,
  type ShippingZoneInfo,
} from "@/lib/shipping";

const zoneA: ShippingZoneInfo = {
  neighborhood: "Boa Viagem",
  zone: "A",
  priceCents: 800,
  freeThresholdCents: 9000,
  routeDays: "TER,QUI,SAB",
};

describe("resolveOwnFleetShipping (GA-405)", () => {
  it("cobra o frete da faixa quando o subtotal está abaixo do mínimo grátis", () => {
    const result = resolveOwnFleetShipping(zoneA, 5000);
    expect(result.isFree).toBe(false);
    expect(result.priceCents).toBe(800);
  });

  it("libera frete grátis exatamente no valor mínimo da faixa", () => {
    const result = resolveOwnFleetShipping(zoneA, 9000);
    expect(result.isFree).toBe(true);
    expect(result.priceCents).toBe(0);
  });

  it("libera frete grátis acima do valor mínimo da faixa", () => {
    const result = resolveOwnFleetShipping(zoneA, 20000);
    expect(result.isFree).toBe(true);
  });
});

describe("resolveCorreiosShipping (fora da área)", () => {
  it("nunca é grátis, mesmo com peso mínimo", () => {
    const result = resolveCorreiosShipping(250);
    expect(result.isFree).toBe(false);
    expect(result.priceCents).toBeGreaterThan(0);
  });

  it("nunca é grátis, mesmo com peso e valor altíssimos", () => {
    const result = resolveCorreiosShipping(50_000);
    expect(result.isFree).toBe(false);
    expect(result.priceCents).toBeGreaterThan(0);
  });
});

describe("resolvePickupShipping", () => {
  it("é sempre grátis", () => {
    const result = resolvePickupShipping();
    expect(result.isFree).toBe(true);
    expect(result.priceCents).toBe(0);
  });
});

describe("quoteDeliveryOptions — regressão GA-412", () => {
  beforeAll(async () => {
    await prisma.shippingZone.deleteMany();
    await prisma.shippingZone.create({
      data: {
        neighborhood: "Boa Viagem",
        zone: "A",
        priceCents: 800,
        freeThresholdCents: 9000,
        routeDays: "TER,QUI,SAB",
      },
    });
  });

  afterAll(async () => {
    await prisma.shippingZone.deleteMany();
    await prisma.$disconnect();
  });

  it("bairro cadastrado (faixa A) libera frete grátis acima do mínimo", async () => {
    const { recommended } = await quoteDeliveryOptions({
      neighborhood: "boa viagem", // minúsculo, sem acento — deve casar mesmo assim
      subtotalCents: 15000,
      totalWeightGrams: 250,
    });
    expect(recommended.id).toBe("DELIVERY_OWN");
    expect(recommended.isFree).toBe(true);
  });

  it("GA-412: bairro fora da área NUNCA recebe frete grátis, mesmo com pedido gigante", async () => {
    const { recommended } = await quoteDeliveryOptions({
      neighborhood: "Bairro Que Não Existe Na Tabela",
      subtotalCents: 1_000_000, // valor absurdamente alto
      totalWeightGrams: 250,
    });
    expect(recommended.id).toBe("CORREIOS");
    expect(recommended.isFree).toBe(false);
    expect(recommended.priceCents).toBeGreaterThan(0);
  });
});
