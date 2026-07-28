import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderIdempotent, createPaymentAttempt } from "@/lib/orders";
import { POST } from "@/app/api/webhooks/pix/route";

let userId: string;
let productId: string;
let variantId: string;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/webhooks/pix", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

async function makeOrderWithPixPayment(overrides: { totalCents?: number } = {}) {
  const order = await createOrderIdempotent({
    userId,
    idempotencyKey: randomUUID(),
    email: "webhook-teste@teste.com",
    cpf: "123.456.789-00",
    deliveryMethod: "PICKUP",
    shippingZoneCode: null,
    shippingLabel: "Retirada na loja",
    shippingCents: 0,
    discountCents: 0,
    couponId: null,
    paymentMethod: "PIX",
    items: [
      {
        productId,
        productVariantId: variantId,
        productNameSnapshot: "Café Teste",
        weightGrams: 250,
        grind: "GRAOS",
        unitPriceCents: overrides.totalCents ?? 5000,
        quantity: 1,
      },
    ],
  });

  const payment = await createPaymentAttempt(order.id, "PIX");
  const gatewayTransactionId = `pix_${randomUUID()}`;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      pixCode: "00020126-simulado",
      gatewayTransactionId,
      pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return { order, paymentId: payment.id, gatewayTransactionId };
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: "webhook-teste@teste.com" } });
  const user = await prisma.user.create({
    data: {
      name: "Cliente Webhook",
      email: "webhook-teste@teste.com",
      passwordHash: "hash",
      phone: "81999999999",
    },
  });
  userId = user.id;

  const product = await prisma.product.create({
    data: {
      slug: `cafe-webhook-${randomUUID()}`,
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
      sku: `SKU-WEBHOOK-${randomUUID()}`,
      priceCents: 5000,
      stockQty: 10,
    },
  });
  variantId = variant.id;
});

beforeEach(async () => {
  await prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: 10 } });
});

afterAll(async () => {
  await prisma.orderItem.deleteMany({ where: { productId } });
  await prisma.payment.deleteMany({ where: { order: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.productVariant.deleteMany({ where: { id: variantId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("POST /api/webhooks/pix", () => {
  it("CA-1: confirma o pagamento e move o pedido para PAGO", async () => {
    const { order, gatewayTransactionId } = await makeOrderWithPixPayment();
    const res = await POST(makeRequest({ gatewayTransactionId }));
    const data = await res.json();
    expect(data.ok).toBe(true);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("PAGO");
  });

  it("CA-3: webhook duplicado não decrementa o estoque de novo nem muda o pedido", async () => {
    const { gatewayTransactionId } = await makeOrderWithPixPayment();

    await POST(makeRequest({ gatewayTransactionId }));
    const variantAfterFirst = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });

    const res2 = await POST(makeRequest({ gatewayTransactionId }));
    const data2 = await res2.json();
    expect(data2.ok).toBe(true);

    const variantAfterSecond = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variantAfterSecond.stockQty).toBe(variantAfterFirst.stockQty);
  });

  it("CA-4: webhook atrasado após expiração reativa o pedido como PAGO, nunca cancela", async () => {
    const { order, gatewayTransactionId } = await makeOrderWithPixPayment();
    await prisma.order.update({ where: { id: order.id }, data: { status: "EXPIRADO" } });

    const res = await POST(makeRequest({ gatewayTransactionId }));
    const data = await res.json();
    expect(data.ok).toBe(true);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("PAGO");
  });

  it("CA-4: reativação sem estoque disponível vai para EM_CONFERENCIA, nunca CANCELADO", async () => {
    const { order, gatewayTransactionId } = await makeOrderWithPixPayment();
    await prisma.order.update({ where: { id: order.id }, data: { status: "EXPIRADO" } });
    await prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: 0 } });

    const res = await POST(makeRequest({ gatewayTransactionId }));
    const data = await res.json();
    expect(data.ok).toBe(true);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("EM_CONFERENCIA");
    expect(updated.status).not.toBe("CANCELADO");
  });

  it("CA-5: valor pago divergente não confirma automaticamente — vai para EM_CONFERENCIA", async () => {
    const { order, gatewayTransactionId } = await makeOrderWithPixPayment({ totalCents: 5000 });

    const res = await POST(makeRequest({ gatewayTransactionId, paidAmountCents: 4000 }));
    const data = await res.json();
    expect(data.ok).toBe(false);

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updated.status).toBe("EM_CONFERENCIA");
  });

  it("gatewayTransactionId ausente retorna 400", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("pagamento inexistente retorna 404", async () => {
    const res = await POST(makeRequest({ gatewayTransactionId: "pix_inexistente" }));
    expect(res.status).toBe(404);
  });
});
