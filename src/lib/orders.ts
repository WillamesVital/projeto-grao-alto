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
  /** Desconto e cupom já resolvidos por `computeOrderPricing` — este módulo
   * nunca recalcula cupom por conta própria, para não haver duas
   * implementações divergentes da mesma conta (raiz histórica do bug
   * RN-403.6). */
  discountCents: number;
  couponId: string | null;
  paymentMethod: PaymentMethod;
  checkoutFlagSnapshot?: string;
  items: OrderItemInput[];
};

function generateOrderNumber() {
  const suffix = Math.floor(1_000_000 + Math.random() * 8_999_999);
  return `GA-${suffix}`;
}

/** Pedidos em que o cupom é considerado "usado" (RN-403.9: contabiliza só no
 * pedido pago, nunca na aplicação) — inclui `EM_CONFERENCIA` porque o
 * dinheiro já foi recebido, mesmo pendente de conferência manual. */
export const PAID_ORDER_STATUSES = [
  "PAGO",
  "EM_CONFERENCIA",
  "EM_PREPARO",
  "PRONTO",
  "A_CAMINHO",
  "ENTREGUE",
] as const;

export type ApplyCouponResult =
  | { ok: true; coupon: Prisma.CouponGetPayload<Record<string, never>>; discountCents: number }
  | { ok: false; error: string };

/**
 * Valida e calcula o desconto de um cupom (RN-403). Não grava nada — o uso
 * só é contabilizado quando o pagamento é confirmado (`confirmOrderPayment`).
 */
export async function applyCoupon(
  code: string,
  subtotalCents: number,
  userId?: string,
): Promise<ApplyCouponResult> {
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
  if (userId) {
    const alreadyUsed = await prisma.order.findFirst({
      where: { userId, couponId: coupon.id, status: { in: [...PAID_ORDER_STATUSES] } },
      select: { id: true },
    });
    if (alreadyUsed) return { ok: false, error: "Você já usou esse cupom." };
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
  const discountCents = input.discountCents;
  const couponId = input.couponId;

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
          checkoutFlagSnapshot: input.checkoutFlagSnapshot,
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

/** Pedido já assentado: webhook duplicado/atrasado não repete efeito colateral algum. */
const ALREADY_SETTLED_STATUSES = new Set<string>([...PAID_ORDER_STATUSES]);
/** Pedido "morto" que pode ser reativado se o dinheiro efetivamente chegou (RN-407.7). */
const REACTIVATABLE_STATUSES = new Set<string>(["EXPIRADO", "CANCELADO"]);

/**
 * Confirma o pagamento e só então debita o estoque, de forma transacional e
 * condicional (nunca deixa o estoque ficar negativo mesmo sob concorrência —
 * o "último item" não é vendido duas vezes).
 *
 * Idempotente por natureza (RN-407.6): um pedido já assentado é devolvido sem
 * repetir nenhum efeito colateral (sem debitar estoque de novo, sem reenviar
 * e-mail). E, diferente do caminho fácil de simplesmente cancelar, um pedido
 * que já expirou ou foi cancelado NUNCA é ignorado quando o pagamento chega
 * depois (RN-407.7): dinheiro recebido sempre reativa o pedido como pago — e,
 * se o estoque já não existir mais, vai para conferência manual da Bia,
 * nunca para cancelamento automático de um pagamento que de fato aconteceu.
 */
export async function confirmOrderPayment(
  orderId: string,
  paymentId: string,
): Promise<ConfirmPaymentResult> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (ALREADY_SETTLED_STATUSES.has(order.status)) {
    return {
      ok: true,
      order: await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, payments: true } }),
    };
  }

  const isReactivation = REACTIVATABLE_STATUSES.has(order.status);
  if (isReactivation) {
    console.warn("[orders] pagamento efetivado após expiração/cancelamento — reativando pedido", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus: order.status,
    });
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
        data: { status: "PAGO", paidAt: new Date() },
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "CAPTURED", confirmedAt: new Date() },
      });

      if (order.couponId) {
        await tx.coupon.update({ where: { id: order.couponId }, data: { timesUsed: { increment: 1 } } });
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("STOCK_UNAVAILABLE:")) {
      const productName = message.split(":")[1];

      if (isReactivation) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: "CAPTURED",
              confirmedAt: new Date(),
              reviewNote: `Pagamento recebido após ${order.status === "EXPIRADO" ? "expiração" : "cancelamento"}, mas "${productName}" está sem estoque. Confirme manualmente com o cliente.`,
            },
          });
          await tx.order.update({ where: { id: orderId }, data: { status: "EM_CONFERENCIA" } });
        });
        console.warn("[orders] pedido reativado sem estoque disponível — conferência manual necessária", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          productName,
        });
        return {
          ok: true,
          order: await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, payments: true } }),
        };
      }

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
