import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createOrderIdempotent, createPaymentAttempt, confirmOrderPayment } from "@/lib/orders";

let userId: string;
let productId: string;
let variantId: string;

async function makeOrderInput(overrides: Partial<Parameters<typeof createOrderIdempotent>[0]> = {}) {
  return {
    userId,
    idempotencyKey: randomUUID(),
    email: "cliente@teste.com",
    cpf: "123.456.789-00",
    deliveryMethod: "PICKUP" as const,
    shippingZoneCode: null,
    shippingLabel: "Retirada na loja",
    shippingCents: 0,
    paymentMethod: "PIX" as const,
    items: [
      {
        productId,
        productVariantId: variantId,
        productNameSnapshot: "Café Teste",
        weightGrams: 250,
        grind: "GRAOS",
        unitPriceCents: 5000,
        quantity: 1,
      },
    ],
    ...overrides,
  };
}

beforeAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany({ where: { email: "cliente@teste.com" } });

  const user = await prisma.user.create({
    data: {
      name: "Cliente Teste",
      email: "cliente@teste.com",
      passwordHash: "hash",
      phone: "81999999999",
    },
  });
  userId = user.id;

  const product = await prisma.product.create({
    data: {
      slug: `cafe-teste-${randomUUID()}`,
      name: "Café Teste",
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
  productId = product.id;

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      weightGrams: 250,
      grind: "GRAOS",
      sku: `SKU-TESTE-${randomUUID()}`,
      priceCents: 5000,
      stockQty: 1,
    },
  });
  variantId = variant.id;
});

afterAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createOrderIdempotent (GA-410 / duplo clique)", () => {
  it("a mesma chave de idempotência nunca gera dois pedidos", async () => {
    const key = randomUUID();
    const input = await makeOrderInput({ idempotencyKey: key });

    const [orderA, orderB] = await Promise.all([
      createOrderIdempotent(input),
      createOrderIdempotent(input),
    ]);

    expect(orderA.id).toBe(orderB.id);

    const count = await prisma.order.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });
});

describe("confirmOrderPayment — concorrência de estoque", () => {
  it("o último item do estoque não é vendido duas vezes", async () => {
    // Reseta o estoque para exatamente 1 unidade e cria dois pedidos distintos
    // (dois clientes diferentes disputando o mesmo último item).
    await prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: 1 } });

    const inputA = await makeOrderInput({ idempotencyKey: randomUUID() });
    const inputB = await makeOrderInput({ idempotencyKey: randomUUID() });

    const orderA = await createOrderIdempotent(inputA);
    const orderB = await createOrderIdempotent(inputB);

    const paymentA = await createPaymentAttempt(orderA.id, "PIX");
    const paymentB = await createPaymentAttempt(orderB.id, "PIX");

    const [resultA, resultB] = await Promise.all([
      confirmOrderPayment(orderA.id, paymentA.id),
      confirmOrderPayment(orderB.id, paymentB.id),
    ]);

    const outcomes = [resultA.ok, resultB.ok];
    expect(outcomes.filter((ok) => ok === true).length).toBe(1);
    expect(outcomes.filter((ok) => ok === false).length).toBe(1);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variant.stockQty).toBe(0);
  });
});
