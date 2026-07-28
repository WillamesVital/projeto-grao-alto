import { Prisma, DeliveryMethod, PaymentMethod, ShippingZoneCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail, orderConfirmationEmailHtml } from "@/lib/mailer";
import { formatBRL } from "@/lib/format";

export type OrderItemInput = {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  weightGrams: number;
  grind: string;
  unitPriceCents: number;
  quantity: number;
};

export type CreateOrderInput = {
  userId: string;
  idempotencyKey: string;
  email: string;
  cpf: string;
  deliveryMethod: DeliveryMethod;
  address?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shippingZoneCode: ShippingZoneCode | null;
  shippingLabel: string;
  shippingCents: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  items: OrderItemInput[];
};

function generateOrderNumber() {
  const suffix = Math.floor(1_000_000 + Math.random() * 8_999_999);
  return `GA-${suffix}`;
}

export type ApplyCouponResult =
  | { ok: true; coupon: Prisma.CouponGetPayload<Record<string, never>>; discountCents: number }
  | { ok: false; error: string };

export async function applyCoupon(code: string, subtotalCents: number): Promise<ApplyCouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { ok: false, error: "Cupom inválido." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Cupom expirado." };
  }
  if (coupon.usageLimit != null && coupon.timesUsed >= coupon.usageLimit) {
    return { ok: false, error: "Cupom esgotado." };
  }
  if (subtotalCents < coupon.minOrderCents) {
    return {
      ok: false,
      error: `Pedido mínimo de ${formatBRL(coupon.minOrderCents)} para usar este cupom.`,
    };
  }

  const rawDiscount = coupon.percentOff
    ? Math.round((subtotalCents * coupon.percentOff) / 100)
    : coupon.fixedOffCents ?? 0;
  const discountCents = Math.min(rawDiscount, subtotalCents);

  return { ok: true, coupon, discountCents };
}

/**
 * Cria o pedido de forma idempotente: duplo clique com a mesma chave nunca
 * gera um segundo pedido (Fluxo 8 / GA-410). O estoque só é debitado na
 * confirmação do pagamento, nunca aqui.
 */
export async function createOrderIdempotent(input: CreateOrderInput) {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true, payments: true },
  });
  if (existing) return existing;

  const subtotalCents = input.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  let discountCents = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const result = await applyCoupon(input.couponCode, subtotalCents);
    if (result.ok) {
      discountCents = result.discountCents;
      couponId = result.coupon.id;
    }
  }

  const totalCents = subtotalCents - discountCents + input.shippingCents;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          idempotencyKey: input.idempotencyKey,
          userId: input.userId,
          email: input.email,
          cpf: input.cpf,
          deliveryMethod: input.deliveryMethod,
          addressCep: input.address?.cep,
          addressStreet: input.address?.street,
          addressNumber: input.address?.number,
          addressComplement: input.address?.complement,
          addressNeighborhood: input.address?.neighborhood,
          addressCity: input.address?.city,
          addressState: input.address?.state,
          shippingZoneCode: input.shippingZoneCode,
          shippingLabel: input.shippingLabel,
          shippingCents: input.shippingCents,
          subtotalCents,
          discountCents,
          totalCents,
          couponId,
          paymentMethod: input.paymentMethod,
          items: {
            create: input.items.map((i) => ({
              productId: i.productId,
              productVariantId: i.productVariantId,
              productNameSnapshot: i.productNameSnapshot,
              weightGrams: i.weightGrams,
              grind: i.grind as never,
              unitPriceCents: i.unitPriceCents,
              quantity: i.quantity,
              totalCents: i.unitPriceCents * i.quantity,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      if (couponId) {
        await prisma.coupon.update({ where: { id: couponId }, data: { timesUsed: { increment: 1 } } });
      }

      return order;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const raceWinner = await prisma.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { items: true, payments: true },
        });
        if (raceWinner) return raceWinner;
        continue;
      }
      throw err;
    }
  }

  throw new Error("Não foi possível criar o pedido (conflito de número de pedido).");
}

/**
 * Cada tentativa de pagamento (inclusive depois de uma recusa, ao trocar de
 * forma de pagamento) gera uma nova linha de Payment — histórico completo,
 * sem sobrescrever a tentativa anterior.
 */
export async function createPaymentAttempt(orderId: string, method: PaymentMethod) {
  return prisma.payment.create({
    data: { orderId, method, status: "PENDING" },
  });
}

export type ConfirmPaymentResult =
  | { ok: true; order: Awaited<ReturnType<typeof createOrderIdempotent>> }
  | { ok: false; reason: string };

/**
 * Confirma o pagamento e só então debita o estoque, de forma transacional e
 * condicional (nunca deixa o estoque ficar negativo mesmo sob concorrência —
 * o "último item" não é vendido duas vezes).
 */
export async function confirmOrderPayment(
  orderId: string,
  paymentId: string,
): Promise<ConfirmPaymentResult> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (order.status !== "AGUARDANDO_PAGAMENTO") {
    return { ok: true, order: await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, payments: true } }) };
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.productVariantId, stockQty: { gte: item.quantity } },
          data: { stockQty: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          throw new Error(`STOCK_UNAVAILABLE:${item.productNameSnapshot}`);
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "EM_PREPARO", paidAt: new Date() },
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "CAPTURED", confirmedAt: new Date() },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("STOCK_UNAVAILABLE:")) {
      const productName = message.split(":")[1];
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "DECLINED",
          declineReason: `Estoque esgotado para "${productName}" no momento da confirmação do pagamento.`,
        },
      });
      await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELADO" } });
      return {
        ok: false,
        reason: `Não foi possível confirmar seu pedido: "${productName}" esgotou. O valor não foi cobrado.`,
      };
    }
    throw err;
  }

  const finalOrder = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, payments: true },
  });

  const deliveryLabel =
    order.deliveryMethod === "PICKUP"
      ? "Retirada na loja: pronto em 4h úteis, guardado por 5 dias."
      : `Entrega: ${order.shippingLabel}.`;

  await sendMail({
    to: order.email,
    subject: `Pedido ${order.orderNumber} confirmado — Grão Alto`,
    html: orderConfirmationEmailHtml({
      orderNumber: order.orderNumber,
      totalLabel: formatBRL(order.totalCents),
      deliveryLabel,
    }),
  });

  return { ok: true, order: finalOrder };
}
