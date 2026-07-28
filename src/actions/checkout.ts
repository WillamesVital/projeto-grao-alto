"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCartForMutation, cartTotals, cartWeightGrams, lockCartForCheckout } from "@/lib/cart";
import {
  findShippingZoneByNeighborhood,
  resolveOwnFleetShipping,
  resolveCorreiosShipping,
  resolvePickupShipping,
  listShippingZones,
} from "@/lib/shipping";
import { applyCoupon, createOrderIdempotent, createPaymentAttempt } from "@/lib/orders";
import { confirmOrderPayment } from "@/lib/orders";
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

export async function quoteShippingPreviewAction(params: {
  deliveryMethod: "DELIVERY" | "PICKUP";
  neighborhood: string;
  subtotalCents: number;
  totalWeightGrams: number;
}) {
  if (params.deliveryMethod === "PICKUP") {
    return resolvePickupShipping();
  }
  const zone = await findShippingZoneByNeighborhood(params.neighborhood);
  if (!zone) return resolveCorreiosShipping(params.totalWeightGrams);
  return resolveOwnFleetShipping(zone, params.subtotalCents);
}

export async function previewCouponAction(code: string, subtotalCents: number) {
  if (!code.trim()) return { ok: false as const, error: "Informe um cupom." };
  return applyCoupon(code, subtotalCents);
}

export async function ensureCheckoutLockAction() {
  const cart = await getOrCreateCartForMutation();
  const isFrozen =
    !!cart.checkoutLockedAt &&
    Date.now() - cart.checkoutLockedAt.getTime() < 30 * 60 * 1000;
  if (!isFrozen) {
    await lockCartForCheckout(cart.id);
  }
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

  const shippingOption =
    data.deliveryMethod === "PICKUP"
      ? resolvePickupShipping()
      : (await findShippingZoneByNeighborhood(data.neighborhood!))
        ? resolveOwnFleetShipping((await findShippingZoneByNeighborhood(data.neighborhood!))!, subtotalCents)
        : resolveCorreiosShipping(cartWeightGrams(cart));

  let couponCode: string | undefined;
  if (data.couponCode?.trim()) {
    const result = await applyCoupon(data.couponCode, subtotalCents);
    couponCode = result.ok ? data.couponCode : undefined;
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
    shippingZoneCode: shippingOption.zoneCode,
    shippingLabel: shippingOption.label,
    shippingCents: shippingOption.priceCents,
    couponCode,
    paymentMethod: data.paymentMethod,
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
