"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductVariant } from "@prisma/client";
import { formatBRL, GRIND_LABELS, weightLabel } from "@/lib/format";
import { addToCartAction } from "@/actions/cart";
import { DEFAULT_GRIND, DEFAULT_WEIGHT } from "@/lib/catalog";

const WEIGHTS = [250, 500, 1000];
const GRINDS: ProductVariant["grind"][] = ["GRAOS", "ESPRESSO", "COADO", "PRENSA"];

const GRIND_ICONS: Record<string, string> = {
  GRAOS: "grain",
  ESPRESSO: "coffee_maker",
  COADO: "filter_alt",
  PRENSA: "oven_gen",
};

export default function ProductVariantSelector({ variants }: { variants: ProductVariant[] }) {
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [grind, setGrind] = useState<ProductVariant["grind"]>(DEFAULT_GRIND);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedVariant = useMemo(
    () => variants.find((v) => v.weightGrams === weight && v.grind === grind),
    [variants, weight, grind],
  );

  const outOfStock = !selectedVariant || selectedVariant.stockQty <= 0;

  function handleAddToCart() {
    if (!selectedVariant || outOfStock) return;
    startTransition(async () => {
      await addToCartAction(selectedVariant.id, quantity);
      setFeedback("Adicionado ao carrinho!");
      router.refresh();
      setTimeout(() => setFeedback(null), 2500);
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
            {WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeight(w)}
                className={`rounded-lg border-2 px-6 py-3 text-label-md transition-all ${
                  weight === w
                    ? "border-coffee-roast bg-coffee-roast text-white"
                    : "border-outline-variant text-on-surface-variant hover:border-coffee-roast"
                }`}
              >
                {weightLabel(w)}
              </button>
            ))}
          </div>
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
          <p className="rounded-lg bg-error-container px-4 py-3 text-label-md text-on-error-container">
            Essa combinação de peso e moagem está esgotada no momento.
          </p>
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
      </div>
      {feedback && <p className="mt-4 text-label-md font-bold text-plantation-green">{feedback}</p>}
    </div>
  );
}
