"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductVariant } from "@prisma/client";
import { formatBRL, GRIND_LABELS, weightLabel } from "@/lib/format";
import { addToCartAction } from "@/actions/cart";
import { requestRestockNotificationAction } from "@/actions/catalog";
import { DEFAULT_GRIND, DEFAULT_WEIGHT } from "@/lib/catalog";

const WEIGHTS = [250, 500, 1000];
const GRINDS: ProductVariant["grind"][] = ["GRAOS", "ESPRESSO", "COADO", "PRENSA"];

const GRIND_ICONS: Record<string, string> = {
  GRAOS: "grain",
  ESPRESSO: "coffee_maker",
  COADO: "filter_alt",
  PRENSA: "oven_gen",
};

export default function ProductVariantSelector({
  variants,
  productId,
  defaultEmail,
}: {
  variants: ProductVariant[];
  productId: string;
  defaultEmail?: string;
}) {
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [grind, setGrind] = useState<ProductVariant["grind"]>(DEFAULT_GRIND);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(false);
  const [restockEmail, setRestockEmail] = useState(defaultEmail ?? "");
  const [restockMessage, setRestockMessage] = useState<string | null>(null);
  const [restockPending, startRestockTransition] = useTransition();
  const router = useRouter();

  const selectedVariant = useMemo(
    () => variants.find((v) => v.weightGrams === weight && v.grind === grind),
    [variants, weight, grind],
  );

  const outOfStock = !selectedVariant || selectedVariant.stockQty <= 0;

  // RN-206.5: desabilita o peso individualmente quando NENHUMA moagem
  // daquele peso tem estoque — não trava a tela inteira por uma combinação só.
  const weightHasStock = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const w of WEIGHTS) {
      map.set(w, variants.some((v) => v.weightGrams === w && v.stockQty > 0));
    }
    return map;
  }, [variants]);

  function handleAddToCart() {
    if (!selectedVariant || outOfStock) return;
    startTransition(async () => {
      const result = await addToCartAction(selectedVariant.id, quantity);
      if (result.cappedReason === "STOCK") {
        setFeedback(`Adicionado! Temos apenas ${result.quantity} unidade(s) em estoque — ajustamos a quantidade no carrinho.`);
      } else if (result.cappedReason === "MAX_PER_ITEM") {
        setFeedback("Adicionado! Limitamos a 10 unidades por item — para mais, fale com a loja pelo WhatsApp.");
      } else {
        setFeedback("Adicionado ao carrinho!");
      }
      router.refresh();
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleRestockRequest() {
    startRestockTransition(async () => {
      const result = await requestRestockNotificationAction(productId, restockEmail);
      setRestockMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col">
      <p className="mb-6 font-bold text-title-lg text-honey-amber">
        {selectedVariant ? formatBRL(selectedVariant.priceCents) : "Indisponível"}
      </p>

      <div className="mb-10 space-y-8">
        <div>
          <label className="mb-3 block text-label-md text-coffee-roast">Selecione o Peso</label>
          <div className="flex flex-wrap gap-3">
            {WEIGHTS.map((w) => {
              const available = weightHasStock.get(w) ?? false;
              return (
                <button
                  key={w}
                  type="button"
                  disabled={!available}
                  onClick={() => setWeight(w)}
                  title={available ? undefined : `Sem estoque para ${weightLabel(w)}`}
                  className={`rounded-lg border-2 px-6 py-3 text-label-md transition-all ${
                    !available
                      ? "cursor-not-allowed border-outline-variant/40 text-on-surface-variant/40 line-through"
                      : weight === w
                        ? "border-coffee-roast bg-coffee-roast text-white"
                        : "border-outline-variant text-on-surface-variant hover:border-coffee-roast"
                  }`}
                >
                  {weightLabel(w)}
                </button>
              );
            })}
          </div>
          {!(weightHasStock.get(weight) ?? false) && (
            <p className="mt-2 text-label-sm text-error-red">Sem estoque para {weightLabel(weight)} no momento.</p>
          )}
        </div>

        <div>
          <label className="mb-3 block text-label-md text-coffee-roast">Tipo de Moagem</label>
          <div className="grid grid-cols-2 gap-3">
            {GRINDS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrind(g)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-label-md transition-all ${
                  grind === g
                    ? "border-coffee-roast bg-coffee-roast text-white"
                    : "border-outline-variant text-on-surface-variant hover:border-coffee-roast"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{GRIND_ICONS[g]}</span>
                {GRIND_LABELS[g]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-label-sm text-on-surface-variant">
            Não sabe qual escolher? <strong>Em grãos</strong> mantém o café fresco por mais tempo —
            moa em casa na hora de preparar. Prefere praticidade? Escolha a moagem do seu método de
            preparo.
          </p>
        </div>

        {outOfStock ? (
          <div className="rounded-lg bg-error-container px-4 py-4 text-on-error-container">
            <p className="mb-3 text-label-md">Essa combinação de peso e moagem está esgotada no momento.</p>
            <label className="mb-1 block text-label-sm font-bold uppercase" htmlFor="restock-email">
              Avise-me quando chegar
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="restock-email"
                type="email"
                value={restockEmail}
                onChange={(e) => setRestockEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 rounded-lg border border-error-red/30 bg-white px-3 py-2 text-body-md text-on-surface focus:border-error-red focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRestockRequest}
                disabled={restockPending || !restockEmail.trim()}
                className="rounded-lg bg-coffee-roast px-4 py-2 text-label-md font-bold text-white transition-colors hover:bg-honey-amber disabled:opacity-60"
              >
                {restockPending ? "Enviando..." : "Avisar"}
              </button>
            </div>
            {restockMessage && <p className="mt-2 text-label-sm font-bold">{restockMessage}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-12 items-center rounded-full border border-outline-variant p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-coffee-roast hover:bg-surface-container-low"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-coffee-roast">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-coffee-roast hover:bg-surface-container-low"
              >
                +
              </button>
            </div>
            <span className="text-label-sm text-on-surface-variant">Máximo de 10 por item</span>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          disabled={outOfStock || isPending}
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-3 rounded-lg bg-coffee-roast py-5 font-bold text-label-md text-white transition-all hover:bg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          {isPending ? "Adicionando..." : "ADICIONAR AO CARRINHO"}
        </button>
        <button
          type="button"
          onClick={() => setWishlisted((v) => !v)}
          aria-label={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={wishlisted}
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-lg border-2 border-outline-variant text-coffee-roast transition-colors hover:border-coffee-roast"
        >
          <span className={`material-symbols-outlined ${wishlisted ? "text-honey-amber" : ""}`} style={wishlisted ? { fontVariationSettings: '"FILL" 1' } : undefined}>
            favorite
          </span>
        </button>
      </div>
      {feedback && <p className="mt-4 text-label-md font-bold text-plantation-green">{feedback}</p>}
    </div>
  );
}
