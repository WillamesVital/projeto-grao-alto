"use client";

import { useState } from "react";
import Image from "next/image";

type Tab = "descricao" | "processo" | "avaliacoes";

const TABS: { id: Tab; label: string }[] = [
  { id: "descricao", label: "Descrição rica" },
  { id: "processo", label: "Processo e origem" },
  { id: "avaliacoes", label: "Avaliações" },
];

export default function ProductTabs({
  description,
  storyTitle,
  storyBody,
  processInfo,
  brewPhotoUrl,
}: {
  description: string;
  storyTitle: string | null;
  storyBody: string | null;
  processInfo: { label: string; value: string; wide?: boolean }[];
  brewPhotoUrl: string;
}) {
  const [tab, setTab] = useState<Tab>("descricao");

  return (
    <section className="mt-24">
      <div className="mb-10 flex gap-8 border-b border-outline-variant/20">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`pb-4 text-label-md tracking-wide uppercase transition-colors ${
              tab === t.id
                ? "border-b-2 border-coffee-roast font-bold text-coffee-roast"
                : "text-on-surface-variant hover:text-coffee-roast"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "descricao" && (
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
          <div>
            <h3 className="font-display mb-4 text-headline-md text-coffee-roast">
              {storyTitle ?? "Sobre este café"}
            </h3>
            <p className="leading-relaxed whitespace-pre-line text-body-md text-on-surface-variant">
              {storyBody ?? description}
            </p>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl md:aspect-square">
            <Image src={brewPhotoUrl} alt="Preparo do café" fill className="object-cover" />
          </div>
        </div>
      )}

      {tab === "processo" && (
        <div className="grid grid-cols-2 gap-6">
          {processInfo.map((info) => (
            <div
              key={info.label}
              className={`rounded-lg bg-surface-container-low p-4 ${info.wide ? "col-span-2" : ""}`}
            >
              <h4 className="mb-1 text-label-md text-coffee-roast">{info.label}</h4>
              <p className="text-sm text-on-surface-variant">{info.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "avaliacoes" && (
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-12 text-center">
          <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant">rate_review</span>
          <p className="text-title-lg text-coffee-roast">Avaliações em breve</p>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Estamos preparando esse espaço para você ler e compartilhar experiências com este café.
          </p>
        </div>
      )}
    </section>
  );
}
