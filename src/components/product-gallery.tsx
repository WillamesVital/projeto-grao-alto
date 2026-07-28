"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({
  images,
  alt,
  scaScore,
}: {
  images: string[];
  alt: string;
  scaScore: number;
}) {
  const [active, setActive] = useState(0);
  const mainImage = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low shadow-md">
        <Image src={mainImage} alt={alt} fill priority className="object-cover" />
        <div className="absolute top-4 left-4">
          <span className="rounded-lg bg-honey-amber px-3 py-1 text-label-sm text-white shadow-sm">
            SCA {scaScore} pts
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? "border-coffee-roast" : "border-transparent hover:border-outline-variant"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
