"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product-card";
import type { Product, ProductVariant } from "@prisma/client";

type Result = { product: Product; defaultVariant: ProductVariant; soldOut: boolean };

/**
 * Filtro por nota sensorial e pontuação SCA é só um refinamento visual sobre
 * a lista já buscada no servidor (RN-202.7: catálogo pequeno, sem paginação)
 * — não vale um round-trip extra ao banco para isso.
 */
export default function ProductCatalog({ results }: { results: Result[] }) {
  const allNotes = useMemo(() => {
    const set = new Set<string>();
    for (const { product } of results) {
      for (const note of product.sensoryNotes.split(",").map((n) => n.trim()).filter(Boolean)) {
        set.add(note);
      }
    }
    return Array.from(set).sort();
  }, [results]);

  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [minSca, setMinSca] = useState<85 | 90 | null>(null);

  function toggleNote(note: string) {
    setActiveNotes((prev) => (prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]));
  }

  const filtered = results.filter(({ product }) => {
    if (activeNotes.length > 0) {
      const notes = product.sensoryNotes.split(",").map((n) => n.trim());
      if (!activeNotes.some((n) => notes.includes(n))) return false;
    }
    if (minSca != null && product.scaScore < minSca) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-10 md:flex-row md:items-start">
      <aside className="w-full shrink-0 md:w-64">
        <h2 className="mb-6 flex items-center gap-2 text-title-lg text-coffee-roast">
          <span className="material-symbols-outlined">filter_list</span>
          Filtros
        </h2>

        <div className="mb-8">
          <h3 className="mb-3 text-label-sm tracking-widest text-on-surface-variant uppercase">
            Notas sensoriais
          </h3>
          <div className="flex flex-wrap gap-2">
            {allNotes.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => toggleNote(note)}
                className={`rounded-full border px-4 py-2 text-label-sm transition-colors ${
                  activeNotes.includes(note)
                    ? "border-coffee-roast bg-coffee-roast text-white"
                    : "border-outline-variant text-on-surface-variant hover:border-coffee-roast"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-label-sm tracking-widest text-on-surface-variant uppercase">
            Pontuação SCA
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <input
                type="checkbox"
                checked={minSca === 85}
                onChange={() => setMinSca((v) => (v === 85 ? null : 85))}
              />
              85+ Pontos (Especial)
            </label>
            <label className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <input
                type="checkbox"
                checked={minSca === 90}
                onChange={() => setMinSca((v) => (v === 90 ? null : 90))}
              />
              90+ Pontos (Raro)
            </label>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-12 text-center">
            <p className="text-title-lg text-coffee-roast">Nenhum café corresponde aos filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ product, defaultVariant, soldOut }) => (
              <ProductCard key={product.id} product={product} defaultVariant={defaultVariant} soldOut={soldOut} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
