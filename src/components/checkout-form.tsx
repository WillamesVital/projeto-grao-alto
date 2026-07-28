"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { formatBRL, GRIND_LABELS, weightLabel } from "@/lib/format";
import { placeOrderAction } from "@/actions/checkout";
import { lookupCepAction, previewOrderPricingAction } from "@/actions/checkout";
import type { FormState } from "@/actions/auth";
import { MIN_INSTALLMENT_CENTS, MAX_INSTALLMENTS } from "@/lib/payment-gateway";

type Item = {
  id: string;
  name: string;
  imageUrl: string;
  weightGrams: number;
  grind: string;
  quantity: number;
  unitPriceCents: number;
};

type ShippingOption = {
  id: "DELIVERY_OWN" | "CORREIOS" | "PICKUP";
  label: string;
  etaLabel: string;
  priceCents: number;
  isFree: boolean;
};

const initialState: FormState = { ok: false };

export default function CheckoutForm({
  idempotencyKey,
  subtotalCents,
  defaultEmail,
  defaultCpf,
  items,
  totalWeightGrams,
}: {
  idempotencyKey: string;
  subtotalCents: number;
  defaultEmail: string;
  defaultCpf: string;
  items: Item[];
  totalWeightGrams: number;
}) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);
  const [, startTransition] = useTransition();

  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const [shipping, setShipping] = useState<ShippingOption | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | undefined>(undefined);
  const [couponResult, setCouponResult] = useState<
    { ok: true; discountCents: number } | { ok: false; error: string } | null
  >(null);

  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "PIX">("CARD");
  const [installments, setInstallments] = useState(1);

  // Cupom e frete são resolvidos por uma única chamada (`previewOrderPricingAction`,
  // a mesma função usada de verdade em `placeOrderAction`), para que a prévia
  // exibida na tela nunca divirja da cobrança final — inclusive quando o
  // cupom derruba o subtotal abaixo do mínimo de frete grátis (RN-403.6).
  useEffect(() => {
    startTransition(async () => {
      const result = await previewOrderPricingAction({
        deliveryMethod,
        neighborhood,
        subtotalCents,
        totalWeightGrams,
        couponCode: appliedCouponCode,
      });
      setShipping(result.shipping);
      if (appliedCouponCode) {
        setCouponResult(
          result.couponError
            ? { ok: false, error: result.couponError }
            : { ok: true, discountCents: result.discountCents },
        );
      }
    });
  }, [deliveryMethod, neighborhood, subtotalCents, totalWeightGrams, appliedCouponCode]);

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    const address = await lookupCepAction(cep);
    setCepLoading(false);
    if (address) {
      setStreet(address.street);
      setNeighborhood(address.neighborhood);
      setCity(address.city);
      setAddressState(address.state);
    }
  }

  function handleApplyCoupon() {
    setAppliedCouponCode(couponCode);
  }

  const discountCents = couponResult?.ok ? couponResult.discountCents : 0;
  const shippingCents = shipping?.priceCents ?? 0;
  const totalCents = subtotalCents - discountCents + shippingCents;
  const maxInstallmentsAllowed = Math.max(
    1,
    Math.min(MAX_INSTALLMENTS, Math.floor(totalCents / MIN_INSTALLMENT_CENTS) || 1),
  );

  return (
    <form action={formAction} className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="deliveryMethod" value={deliveryMethod} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      {couponResult?.ok && appliedCouponCode && (
        <input type="hidden" name="couponCode" value={appliedCouponCode} />
      )}

      <div className="space-y-gutter lg:col-span-8">
        {/* 1. Identificação */}
        <section className="rounded-lg border border-outline-variant/10 bg-white p-8 shadow-[0_4px_12px_rgba(39,19,16,0.04)]">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-coffee-roast text-sm font-semibold text-paper-offwhite">
              1
            </div>
            <h2 className="font-display text-headline-md text-coffee-roast">Identificação</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant">E-mail</label>
              <input
                name="email"
                type="email"
                defaultValue={defaultEmail}
                required
                className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant">CPF (obrigatório)</label>
              <input
                name="cpf"
                type="text"
                defaultValue={defaultCpf}
                required
                placeholder="000.000.000-00"
                className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 2. Entrega */}
        <section className="rounded-lg border border-outline-variant/10 bg-white p-8 shadow-[0_4px_12px_rgba(39,19,16,0.04)]">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-coffee-roast text-sm font-semibold text-paper-offwhite">
              2
            </div>
            <h2 className="font-display text-headline-md text-coffee-roast">Entrega</h2>
          </div>

          <div className="mb-6 flex gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMethod("DELIVERY")}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-label-md transition-all ${deliveryMethod === "DELIVERY" ? "border-coffee-roast bg-coffee-roast text-white" : "border-outline-variant text-on-surface-variant"}`}
            >
              Receber em casa
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("PICKUP")}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-label-md transition-all ${deliveryMethod === "PICKUP" ? "border-coffee-roast bg-coffee-roast text-white" : "border-outline-variant text-on-surface-variant"}`}
            >
              Retirar na loja
            </button>
          </div>

          {deliveryMethod === "DELIVERY" && (
            <div className="space-y-6">
              <div className="flex max-w-xs flex-col gap-2">
                <label className="text-label-md text-on-surface-variant">CEP</label>
                <input
                  name="cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="50000-000"
                  className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                />
                {cepLoading && <span className="text-label-sm text-on-surface-variant">Buscando endereço...</span>}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Rua / Logradouro</label>
                  <input
                    name="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Número</label>
                    <input
                      name="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Bairro</label>
                    <input
                      name="neighborhood"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Complemento</label>
                  <input
                    name="complement"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Cidade / UF</label>
                  <div className="flex gap-2">
                    <input
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-2/3 rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                    <input
                      name="state"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      maxLength={2}
                      className="w-1/3 rounded-lg border border-outline-variant bg-white p-3 text-body-md uppercase focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-surface-container-low p-4">
            {shipping ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-title-lg text-coffee-roast">{shipping.label}</p>
                  <p className="text-label-sm text-on-surface-variant italic">{shipping.etaLabel}</p>
                </div>
                <span className="font-bold whitespace-nowrap text-plantation-green">
                  {shipping.isFree ? "Grátis" : formatBRL(shipping.priceCents)}
                </span>
              </div>
            ) : (
              <p className="text-label-sm text-on-surface-variant">Calculando frete...</p>
            )}
          </div>
        </section>

        {/* 3. Pagamento */}
        <section className="rounded-lg border border-outline-variant/10 bg-white p-8 shadow-[0_4px_12px_rgba(39,19,16,0.04)]">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-coffee-roast text-sm font-semibold text-paper-offwhite">
              3
            </div>
            <h2 className="font-display text-headline-md text-coffee-roast">Pagamento</h2>
          </div>

          <div className="mb-8 flex gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-6 py-4 transition-all ${paymentMethod === "CARD" ? "border-coffee-roast bg-coffee-roast text-on-primary" : "border-outline-variant text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined">credit_card</span>
              Cartão de Crédito
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("PIX")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-6 py-4 transition-all ${paymentMethod === "PIX" ? "border-coffee-roast bg-coffee-roast text-on-primary" : "border-outline-variant text-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              Pix
            </button>
          </div>

          {paymentMethod === "CARD" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface-variant">Número do Cartão</label>
                <input
                  name="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  required={paymentMethod === "CARD"}
                  className="w-full rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                />
                <p className="text-label-sm text-on-surface-variant">
                  Simulação: qualquer número funciona, exceto terminados em 0002 (recusa de teste).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-label-md text-on-surface-variant">Nome no Cartão</label>
                  <input
                    name="cardName"
                    className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">Validade</label>
                    <input
                      name="cardExpiry"
                      placeholder="MM/AA"
                      className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-label-md text-on-surface-variant">CVV</label>
                    <input
                      name="cardCvv"
                      placeholder="123"
                      className="rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <label className="text-label-md text-on-surface-variant">Parcelamento</label>
                <select
                  name="installments"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="cursor-pointer rounded-lg border border-outline-variant bg-white p-3 text-body-md"
                >
                  {Array.from({ length: maxInstallmentsAllowed }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatBRL(Math.ceil(totalCents / n))} (sem juros)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="material-symbols-outlined text-5xl text-honey-amber">qr_code_2</span>
              <p className="max-w-xs text-body-md text-on-surface-variant">
                Ao confirmar, geraremos um QR Code e um código copia e cola simulados, válidos por 30
                minutos.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Resumo */}
      <aside className="space-y-gutter lg:sticky lg:top-8 lg:col-span-4">
        <div className="overflow-hidden rounded-lg border border-outline-variant/10 bg-white">
          <div className="border-b border-outline-variant bg-surface-container-high p-6">
            <h3 className="font-display text-headline-md text-coffee-roast">Resumo do Pedido</h3>
          </div>
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-surface-container">
                    <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h4 className="text-title-lg leading-tight text-coffee-roast">{item.name}</h4>
                      <span className="text-label-sm text-on-surface-variant">
                        {weightLabel(item.weightGrams)} · {GRIND_LABELS[item.grind]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-label-md">Qtd: {item.quantity}</span>
                      <span className="font-bold">{formatBRL(item.unitPriceCents * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-outline-variant pt-4">
              <label className="mb-2 block text-label-sm tracking-wider text-on-surface-variant uppercase">
                Cupom de desconto
              </label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponResult(null);
                  }}
                  placeholder="CÓDIGO"
                  className="h-11 flex-grow rounded border-outline-variant bg-paper-offwhite px-4 text-sm uppercase focus:border-honey-amber focus:ring-1 focus:ring-honey-amber"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="h-11 rounded bg-coffee-roast px-6 text-label-md text-on-primary transition-soft hover:bg-honey-amber"
                >
                  Aplicar
                </button>
              </div>
              {couponResult && (
                <p className={`mt-2 text-label-sm ${couponResult.ok ? "text-plantation-green" : "text-error-red"}`}>
                  {couponResult.ok ? `Cupom aplicado: -${formatBRL(couponResult.discountCents)}` : couponResult.error}
                </p>
              )}
            </div>

            <hr className="border-outline-variant opacity-20" />

            <div className="space-y-2">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatBRL(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-plantation-green">
                  <span>Desconto</span>
                  <span>-{formatBRL(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Frete</span>
                <span className={shipping?.isFree ? "text-plantation-green" : ""}>
                  {shipping ? (shipping.isFree ? "Grátis" : formatBRL(shipping.priceCents)) : "—"}
                </span>
              </div>
              <div className="mt-4 flex justify-between border-t border-outline-variant pt-4">
                <span className="font-bold text-headline-md text-coffee-roast">Total</span>
                <span className="font-bold text-headline-md text-coffee-roast">{formatBRL(totalCents)}</span>
              </div>
            </div>

            {state.message && !state.ok && (
              <p className="rounded-lg bg-error-container px-4 py-3 text-label-md text-on-error-container">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || !shipping}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coffee-roast py-5 text-title-lg font-bold text-on-primary transition-all hover:bg-honey-amber active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? "Processando..." : "Finalizar Pedido"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-center text-label-sm text-on-surface-variant italic">
              * Pagamento simulado para fins do curso — nenhuma cobrança real é feita.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-surface-container-low p-6">
          <p className="mb-3 text-title-lg text-coffee-roast">Precisa de ajuda?</p>
          <a
            href="https://wa.me/5581999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-label-md text-coffee-roast hover:text-honey-amber"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Falar com especialista pelo WhatsApp
          </a>
        </div>
      </aside>
    </form>
  );
}
