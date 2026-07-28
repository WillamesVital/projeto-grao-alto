import Link from "next/link";
import Image from "next/image";
import { formatBRL, formatDate } from "@/lib/format";
import type { Product, ProductVariant } from "@prisma/client";

type Props = {
  product: Product;
  defaultVariant: ProductVariant;
  soldOut: boolean;
};

export default function ProductCard({ product, defaultVariant, soldOut }: Props) {
  const notes = product.sensoryNotes.split(",").map((n) => n.trim()).filter(Boolean);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-lg border border-transparent bg-white shadow-[0_12px_24px_-10px_rgba(39,19,16,0.04)] transition-all duration-300 hover:border-outline-variant hover:shadow-[0_16px_32px_-12px_rgba(39,19,16,0.08)] ${soldOut ? "opacity-80 grayscale-[0.3]" : ""}`}
    >
      <Link href={`/produtos/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 rounded-sm bg-tertiary-fixed px-3 py-1 text-label-sm text-on-tertiary-container">
          SCA: {product.scaScore} pts
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <span className="rounded bg-error-red px-4 py-2 text-label-md font-bold tracking-widest text-white uppercase">
              Esgotado
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-1 text-label-sm tracking-widest text-on-surface-variant uppercase">
          {product.region}
        </p>
        <Link href={`/produtos/${product.slug}`}>
          <h4 className="font-display mb-2 text-headline-md text-coffee-roast">{product.name}</h4>
        </Link>
        <div className="mb-4 flex flex-wrap gap-1">
          {notes.slice(0, 2).map((note) => (
            <span
              key={note}
              className="rounded bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-on-surface-variant uppercase"
            >
              {note}
            </span>
          ))}
        </div>
        <div className="mt-auto">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="mb-1 text-label-sm text-on-surface-variant">
                Última torra: {formatDate(product.lastRoastDate)}
              </p>
              <p className="font-display text-headline-md leading-none text-coffee-roast">
                {formatBRL(defaultVariant.priceCents)}
              </p>
            </div>
          </div>
          <Link
            href={`/produtos/${product.slug}`}
            aria-disabled={soldOut}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-label-md transition-colors ${
              soldOut
                ? "pointer-events-none cursor-not-allowed bg-surface-variant text-on-surface-variant"
                : "bg-coffee-roast text-paper-offwhite hover:bg-honey-amber"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {soldOut ? "notifications" : "visibility"}
            </span>
            {soldOut ? "Avise-me quando chegar" : "Ver detalhes"}
          </Link>
        </div>
      </div>
    </div>
  );
}
