"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { previewOrderPricingAction } from "@/actions/checkout";

/**
 * Prévia do cupom no carrinho — usa a mesma `computeOrderPricing` do checkout
 * (via `previewOrderPricingAction`), só que sem bairro/entrega definidos
 * ainda (o frete de verdade só é decidido no checkout). O desconto exibido
 * aqui é o mesmo que será aplicado de verdade, nunca um cálculo duplicado.
 */
export default function CartSummary({
  subtotalCents,
  hasOutOfStock,
}: {
  subtotalCents: number;
  hasOutOfStock: boolean;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [pricing, setPricing] = useState<{ discountCents: number; couponError: string | null } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApplyCoupon() {
    startTransition(async () => {
      const result = await previewOrderPricingAction({
        deliveryMethod: "PICKUP",
        neighborhood: "",
        subtotalCents,
        totalWeightGrams: 0,
        couponCode,
      });
      setPricing({ discountCents: result.discountCents, couponError: result.couponError });
    });
  }

  const discountCents = pricing?.discountCents ?? 0;

  return (
    <>
      <div className="rounded-lg border border-outline-variant/10 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(39,19,16,0.06)] md:p-8">
        <h2 className="font-display mb-6 text-headline-md text-coffee-roast">Resumo</h2>

        <div className="mb-6 border-b border-outline-variant/20 pb-6">
          <label className="mb-2 block text-label-sm tracking-wider text-on-surface-variant uppercase">
            Cupom de desconto
          </label>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setPricing(null);
              }}
              placeholder="CÓDIGO"
              className="h-11 flex-grow rounded border border-outline-variant bg-paper-offwhite px-4 text-sm uppercase focus:border-honey-amber focus:ring-1 focus:ring-honey-amber focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isPending || !couponCode.trim()}
              className="h-11 rounded bg-coffee-roast px-6 text-label-md text-on-primary transition-colors hover:bg-honey-amber disabled:opacity-60"
            >
              {isPending ? "..." : "Aplicar"}
            </button>
          </div>
          {pricing && (
            <p className={`mt-2 text-label-sm ${pricing.couponError ? "text-error-red" : "text-plantation-green"}`}>
              {pricing.couponError ?? `Cupom aplicado: -${formatBRL(pricing.discountCents)}`}
            </p>
          )}
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span className="font-medium text-on-surface">{formatBRL(subtotalCents)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-plantation-green">
              <span>Desconto</span>
              <span>-{formatBRL(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-on-surface-variant">
            <span>Frete</span>
            <span className="text-label-sm">calculado no checkout</span>
          </div>
        </div>

        {hasOutOfStock && (
          <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
            Remova os itens esgotados para continuar.
          </p>
        )}

        <Link
          href={hasOutOfStock ? "#" : "/checkout"}
          aria-disabled={hasOutOfStock}
          className={`flex w-full items-center justify-center gap-2 rounded py-4 text-title-lg transition-all active:scale-95 ${
            hasOutOfStock
              ? "pointer-events-none cursor-not-allowed bg-surface-variant text-on-surface-variant"
              : "bg-coffee-roast text-on-primary hover:bg-honey-amber"
          }`}
        >
          Finalizar Compra
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
        <div className="mt-6 flex items-center justify-center gap-2 text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          Pagamento simulado (curso) — nenhuma cobrança real
        </div>
      </div>

      <div className="mt-gutter flex items-center gap-4 rounded-lg bg-surface-container-low p-4">
        <span className="material-symbols-outlined text-honey-amber">local_shipping</span>
        <div>
          <p className="text-title-lg text-coffee-roast">Entrega Expressa</p>
          <p className="text-label-sm text-on-surface-variant">Receba em Recife em até 24h.</p>
        </div>
      </div>
    </>
  );
}
