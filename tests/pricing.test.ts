import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { computeOrderPricing } from "@/lib/pricing";
import type { ShippingZoneInfo } from "@/lib/shipping";

const zoneB: ShippingZoneInfo = {
  neighborhood: "Casa Forte",
  zone: "B",
  priceCents: 1200,
  freeThresholdCents: 12000,
  routeDays: "TER,QUI,SAB",
};

const COUPON_CODE = `CUPOM20-${randomUUID().slice(0, 8)}`.toUpperCase();

let userId: string;

beforeAll(async () => {
  await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } });
  await prisma.coupon.create({
    data: { code: COUPON_CODE, percentOff: 20, active: true },
  });

  await prisma.user.deleteMany({ where: { email: "pricing-teste@teste.com" } });
  const user = await prisma.user.create({
    data: {
      name: "Cliente Pricing",
      email: "pricing-teste@teste.com",
      passwordHash: "hash",
      phone: "81999999999",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.coupon.deleteMany({ where: { code: COUPON_CODE } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("computeOrderPricing — ordem cupom → frete grátis (RN-403.6/RN-405.3)", () => {
  it("sem cupom: subtotal de R$130 na faixa B (mínimo R$120) tem frete grátis", async () => {
    const result = await computeOrderPricing({
      subtotalCents: 13000,
      deliveryMethod: "DELIVERY",
      zone: zoneB,
      totalWeightGrams: 250,
    });
    expect(result.discountCents).toBe(0);
    expect(result.shipping.priceCents).toBe(0);
    expect(result.shipping.isFree).toBe(true);
    expect(result.totalCents).toBe(13000);
  });

  it("GA-403 CA-2: cupom de 20% derruba o subtotal para R$104 e o frete de R$12 volta a ser cobrado", async () => {
    const result = await computeOrderPricing({
      subtotalCents: 13000,
      couponCode: COUPON_CODE,
      deliveryMethod: "DELIVERY",
      zone: zoneB,
      totalWeightGrams: 250,
    });
    expect(result.discountCents).toBe(2600); // 20% de 13000
    expect(result.shipping.isFree).toBe(false);
    expect(result.shipping.priceCents).toBe(1200);
    // subtotal (13000) - desconto (2600) + frete (1200) = 11600
    expect(result.totalCents).toBe(11600);
  });

  it("cupom inválido não aplica desconto e o frete é calculado sobre o subtotal cheio", async () => {
    const result = await computeOrderPricing({
      subtotalCents: 13000,
      couponCode: "CODIGO-QUE-NAO-EXISTE",
      deliveryMethod: "DELIVERY",
      zone: zoneB,
      totalWeightGrams: 250,
    });
    expect(result.discountCents).toBe(0);
    expect(result.couponError).toBeTruthy();
    expect(result.shipping.isFree).toBe(true);
  });

  it("fora da área (zone null): nunca há frete grátis, mesmo com subtotal alto", async () => {
    const result = await computeOrderPricing({
      subtotalCents: 1_000_000,
      deliveryMethod: "DELIVERY",
      zone: null,
      totalWeightGrams: 250,
    });
    expect(result.shipping.id).toBe("CORREIOS");
    expect(result.shipping.isFree).toBe(false);
    expect(result.shipping.priceCents).toBeGreaterThan(0);
  });

  it("retirada na loja: frete sempre zero, mesmo com cupom", async () => {
    const result = await computeOrderPricing({
      subtotalCents: 5000,
      couponCode: COUPON_CODE,
      deliveryMethod: "PICKUP",
      zone: null,
      totalWeightGrams: 250,
    });
    expect(result.shipping.priceCents).toBe(0);
    expect(result.discountCents).toBe(1000);
  });

  it("RN-403.4/CA-5: cupom já usado pelo mesmo cliente num pedido pago é recusado", async () => {
    const product = await prisma.product.create({
      data: {
        slug: `cafe-pricing-${randomUUID()}`,
        name: "Café Pricing",
        region: "Teste",
        sensoryNotes: "Nota",
        process: "Natural",
        scaScore: 85,
        description: "desc",
        imageUrl: "https://example.com/img.jpg",
        galleryUrls: "[]",
        lastRoastDate: new Date(),
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        weightGrams: 250,
        grind: "GRAOS",
        sku: `SKU-PRICING-${randomUUID()}`,
        priceCents: 5000,
        stockQty: 5,
      },
    });
    const coupon = await prisma.coupon.findUniqueOrThrow({ where: { code: COUPON_CODE } });

    await prisma.order.create({
      data: {
        orderNumber: `GA-${randomUUID().slice(0, 7)}`,
        idempotencyKey: randomUUID(),
        userId,
        email: "pricing-teste@teste.com",
        cpf: "123.456.789-00",
        deliveryMethod: "PICKUP",
        shippingLabel: "Retirada na loja",
        shippingCents: 0,
        subtotalCents: 5000,
        discountCents: 1000,
        totalCents: 4000,
        couponId: coupon.id,
        paymentMethod: "PIX",
        status: "PAGO",
        items: {
          create: [
            {
              productId: product.id,
              productVariantId: variant.id,
              productNameSnapshot: "Café Pricing",
              weightGrams: 250,
              grind: "GRAOS",
              unitPriceCents: 5000,
              quantity: 1,
              totalCents: 5000,
            },
          ],
        },
      },
    });

    const result = await computeOrderPricing({
      subtotalCents: 5000,
      couponCode: COUPON_CODE,
      userId,
      deliveryMethod: "PICKUP",
      zone: null,
      totalWeightGrams: 250,
    });
    expect(result.discountCents).toBe(0);
    expect(result.couponError).toMatch(/já usou/i);

    await prisma.orderItem.deleteMany({ where: { productId: product.id } });
    await prisma.order.deleteMany({ where: { userId, couponId: coupon.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
  });
});
