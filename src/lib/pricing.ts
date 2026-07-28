import type { ShippingZoneInfo, ShippingOption } from "@/lib/shipping";
import { resolveOwnFleetShipping, resolveCorreiosShipping, resolvePickupShipping } from "@/lib/shipping";
import { applyCoupon } from "@/lib/orders";

export type PricingInput = {
  subtotalCents: number;
  couponCode?: string;
  userId?: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  /** Faixa de entrega própria do bairro informado, ou `null` quando o bairro
   * está fora das faixas A/B/C (Correios) — irrelevante para retirada. */
  zone: ShippingZoneInfo | null;
  totalWeightGrams: number;
};

export type PricingResult = {
  subtotalCents: number;
  discountCents: number;
  couponId: string | null;
  couponCode: string | null;
  couponError: string | null;
  shipping: ShippingOption;
  totalCents: number;
};

/**
 * Único lugar do sistema que decide desconto e frete — usado tanto na prévia
 * exibida na tela (carrinho/checkout) quanto na cobrança de verdade
 * (`placeOrderAction`), para que os dois nunca divirjam.
 *
 * RN-403.6 / RN-405.3: o desconto do cupom é aplicado ANTES da verificação do
 * limiar de frete grátis. O valor comparado com o mínimo da faixa é o
 * subtotal já com desconto, nunca o subtotal bruto — um cupom pode derrubar
 * o pedido abaixo do mínimo e fazer o frete voltar a ser cobrado (GA-403 CA-2).
 */
export async function computeOrderPricing(input: PricingInput): Promise<PricingResult> {
  let discountCents = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  let couponError: string | null = null;

  if (input.couponCode?.trim()) {
    const result = await applyCoupon(input.couponCode, input.subtotalCents, input.userId);
    if (result.ok) {
      discountCents = result.discountCents;
      couponId = result.coupon.id;
      couponCode = result.coupon.code;
    } else {
      couponError = result.error;
    }
  }

  const discountedSubtotalCents = input.subtotalCents - discountCents;

  const shipping =
    input.deliveryMethod === "PICKUP"
      ? resolvePickupShipping()
      : input.zone
        ? resolveOwnFleetShipping(input.zone, discountedSubtotalCents)
        : resolveCorreiosShipping(input.totalWeightGrams);

  const totalCents = discountedSubtotalCents + shipping.priceCents;

  return {
    subtotalCents: input.subtotalCents,
    discountCents,
    couponId,
    couponCode,
    couponError,
    shipping,
    totalCents,
  };
}
