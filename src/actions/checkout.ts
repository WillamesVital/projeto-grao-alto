"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getOrCreateCartForMutation,
  cartTotals,
  cartWeightGrams,
  lockCartForCheckout,
  ensureCheckoutIdempotencyKey,
  clearCheckoutIdempotencyKey,
} from "@/lib/cart";
import { findShippingZoneByNeighborhood, listShippingZones } from "@/lib/shipping";
import { createOrderIdempotent, createPaymentAttempt } from "@/lib/orders";
import { confirmOrderPayment } from "@/lib/orders";
import { computeOrderPricing } from "@/lib/pricing";
import { isCheckoutEnabledForZone, checkoutFlagSnapshot } from "@/lib/feature-flags";
import { generatePixCharge, authorizeCardCharge } from "@/lib/payment-gateway";
import { checkoutSchema } from "@/lib/validation";
import { lookupCep, type CepAddress } from "@/lib/cep";
import type { FormState } from "@/actions/auth";

export async function lookupCepAction(cep: string): Promise<CepAddress | null> {
  return lookupCep(cep);
}

export async function listShippingZonesAction() {
  return listShippingZones();
}

/**
 * Marca o pedido como `EXPIRADO` quando o Pix vence sem pagamento (RN-407.5).
 * Sem um job de fundo neste projeto, a transição acontece "de forma
 * preguiçosa": no primeiro carregamento da tela de espera após o vencimento.
 * Um webhook que chegue depois disso ainda reativa o pedido normalmente
 * (RN-407.7) — `confirmOrderPayment` trata `EXPIRADO` como reativável.
 */
export async function markOrderExpiredIfNeededAction(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || order.status !== "AGUARDANDO_PAGAMENTO") return;

  const pendingPix = order.payments.find((p) => p.method === "PIX" && p.status === "PENDING");
  if (pendingPix?.pixExpiresAt && pendingPix.pixExpiresAt.getTime() < Date.now()) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "EXPIRADO" } });
  }
}

/** Gera um novo Pix para um pedido já criado cujo código anterior expirou (GA-407 CA-2). */
export async function generateNewPixAction(orderNumber: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.userId !== user.id) redirect("/pedidos");
  if (order.paymentMethod !== "PIX" || (order.status !== "EXPIRADO" && order.status !== "AGUARDANDO_PAGAMENTO")) {
    redirect(`/pedidos/${orderNumber}`);
  }

  const payment = await createPaymentAttempt(order.id, "PIX");
  const charge = await generatePixCharge(order.orderNumber, order.totalCents);
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        pixCode: charge.pixCode,
        pixExpiresAt: charge.expiresAt,
        gatewayTransactionId: charge.gatewayTransactionId,
      },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: "AGUARDANDO_PAGAMENTO" } }),
  ]);

  redirect(`/checkout/pix/${order.orderNumber}`);
}

/**
 * Prévia de preço exibida na tela (carrinho e checkout) — usa exatamente a
 * mesma função (`computeOrderPricing`) que decide a cobrança de verdade em
 * `placeOrderAction`, para que a tela nunca mostre um valor diferente do que
 * é cobrado (RN-401.7).
 */
export async function previewOrderPricingAction(params: {
  deliveryMethod: "DELIVERY" | "PICKUP";
  neighborhood: string;
  subtotalCents: number;
  totalWeightGrams: number;
  couponCode?: string;
}) {
  const user = await getCurrentUser();
  const zone =
    params.deliveryMethod === "PICKUP" ? null : await findShippingZoneByNeighborhood(params.neighborhood);
  return computeOrderPricing({
    subtotalCents: params.subtotalCents,
    couponCode: params.couponCode,
    userId: user?.id,
    deliveryMethod: params.deliveryMethod,
    zone,
    totalWeightGrams: params.totalWeightGrams,
  });
}

export async function ensureCheckoutLockAction() {
  const cart = await getOrCreateCartForMutation();
  const isFrozen =
    !!cart.checkoutLockedAt &&
    Date.now() - cart.checkoutLockedAt.getTime() < 30 * 60 * 1000;
  if (!isFrozen) {
    await lockCartForCheckout(cart.id);
  }
  return ensureCheckoutIdempotencyKey(cart.id);
}

export async function placeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  if (!idempotencyKey) {
    return { ok: false, message: "Sessão de checkout inválida. Recarregue a página." };
  }

  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    deliveryMethod: formData.get("deliveryMethod"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    couponCode: formData.get("couponCode"),
    paymentMethod: formData.get("paymentMethod"),
    cardNumber: formData.get("cardNumber"),
    cardName: formData.get("cardName"),
    cardExpiry: formData.get("cardExpiry"),
    cardCvv: formData.get("cardCvv"),
    installments: formData.get("installments") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  if (data.deliveryMethod === "DELIVERY" && (!data.street || !data.number || !data.neighborhood || !data.city)) {
    return { ok: false, message: "Preencha o endereço completo para entrega." };
  }

  const cart = await getOrCreateCartForMutation();
  if (cart.items.length === 0) {
    return { ok: false, message: "Seu carrinho está vazio." };
  }
  if (cart.items.some((i) => i.outOfStockFlag)) {
    return { ok: false, message: "Remova os itens esgotados do carrinho antes de continuar." };
  }

  const subtotalCents = cartTotals(cart);

  const zone =
    data.deliveryMethod === "PICKUP" ? null : await findShippingZoneByNeighborhood(data.neighborhood!);

  const pricing = await computeOrderPricing({
    subtotalCents,
    couponCode: data.couponCode?.trim() || undefined,
    userId: user.id,
    deliveryMethod: data.deliveryMethod,
    zone,
    totalWeightGrams: cartWeightGrams(cart),
  });

  // GA-409: checkout pode estar desligado para a faixa do cliente durante um
  // rollout gradual — ele é orientado a fechar pelo WhatsApp, sem quebrar a navegação.
  if (!isCheckoutEnabledForZone(pricing.shipping.zoneCode)) {
    return {
      ok: false,
      message: "Ainda não atendemos seu bairro pelo site. Fale com a gente pelo WhatsApp para fechar seu pedido.",
    };
  }

  const order = await createOrderIdempotent({
    userId: user.id,
    idempotencyKey,
    email: data.email,
    cpf: data.cpf,
    deliveryMethod: data.deliveryMethod,
    address:
      data.deliveryMethod === "DELIVERY"
        ? {
            cep: data.cep ?? "",
            street: data.street!,
            number: data.number!,
            complement: data.complement ?? undefined,
            neighborhood: data.neighborhood!,
            city: data.city!,
            state: data.state ?? "",
          }
        : undefined,
    shippingZoneCode: pricing.shipping.zoneCode,
    shippingLabel: pricing.shipping.label,
    shippingCents: pricing.shipping.priceCents,
    discountCents: pricing.discountCents,
    couponId: pricing.couponId,
    paymentMethod: data.paymentMethod,
    checkoutFlagSnapshot: checkoutFlagSnapshot(),
    items: cart.items.map((i) => ({
      productId: i.productId,
      productVariantId: i.productVariantId,
      productNameSnapshot: i.product.name,
      weightGrams: i.productVariant.weightGrams,
      grind: i.productVariant.grind,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    })),
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await clearCheckoutIdempotencyKey(cart.id);

  // RN-408.9/RN-407.6: um retry (duplo clique, rede lenta) reenvia a mesma
  // idempotencyKey e cai aqui com um `order` já existente — se já existe uma
  // tentativa de pagamento reaproveitável para ele, seguimos direto para a
  // tela correspondente em vez de gerar um segundo Pix ou uma segunda
  // autorização de cartão.
  const existingPixPending = order.payments.find(
    (p) => p.method === "PIX" && p.status === "PENDING" && p.pixExpiresAt && p.pixExpiresAt.getTime() > Date.now(),
  );
  if (existingPixPending) {
    redirect(`/checkout/pix/${order.orderNumber}`);
  }
  const existingCaptured = order.payments.find((p) => p.status === "CAPTURED");
  if (existingCaptured) {
    redirect(`/pedido-confirmado/${order.orderNumber}`);
  }

  if (data.paymentMethod === "PIX") {
    const payment = await createPaymentAttempt(order.id, "PIX");
    const charge = await generatePixCharge(order.orderNumber, order.totalCents);
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        pixCode: charge.pixCode,
        pixExpiresAt: charge.expiresAt,
        gatewayTransactionId: charge.gatewayTransactionId,
      },
    });
    redirect(`/checkout/pix/${order.orderNumber}`);
  }

  const payment = await createPaymentAttempt(order.id, "CARD");
  const authResult = authorizeCardCharge({
    cardNumber: data.cardNumber ?? "",
    installments: data.installments ?? 1,
    amountCents: order.totalCents,
  });

  if (!authResult.approved) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "DECLINED", declineReason: authResult.reason },
    });
    return {
      ok: false,
      message: `${authResult.reason} Você pode tentar outro cartão ou usar Pix.`,
    };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      gatewayTransactionId: authResult.gatewayTransactionId,
      cardLast4: authResult.last4,
      installments: data.installments ?? 1,
    },
  });

  const confirmResult = await confirmOrderPayment(order.id, payment.id);
  if (!confirmResult.ok) {
    return { ok: false, message: confirmResult.reason };
  }

  redirect(`/pedido-confirmado/${order.orderNumber}`);
}
