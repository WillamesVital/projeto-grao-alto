import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import ProductVariantSelector from "@/components/product-variant-selector";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-8 md:px-margin-desktop md:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low shadow-md">
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            <div className="absolute top-4 left-4">
              <span className="rounded-lg bg-honey-amber px-3 py-1 text-label-sm text-white shadow-sm">
                SCA {product.scaScore} pts
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:col-span-5">
          <nav className="mb-4 flex items-center gap-2 text-label-sm text-on-surface-variant">
            <Link href="/" className="hover:text-coffee-roast">
              Cafés
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="font-bold text-coffee-roast">{product.name}</span>
          </nav>
          <h1 className="font-display mb-2 text-headline-lg text-coffee-roast">{product.name}</h1>

          <ProductVariantSelector variants={product.variants} />

          <p className="mt-8 leading-relaxed text-body-md text-on-surface-variant">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-6 border-t border-outline-variant/20 py-6">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-plantation-green">local_shipping</span>
              <span className="text-label-sm">Frete grátis por faixa de bairro</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-plantation-green">verified</span>
              <span className="text-label-sm">Torra: {formatDate(product.lastRoastDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24">
        <div className="grid grid-cols-1 items-start gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="font-display text-headline-md text-coffee-roast">Processo e Origem</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-lg bg-surface-container-low p-4">
                <h4 className="mb-1 text-label-md text-coffee-roast">Processo</h4>
                <p className="text-sm text-on-surface-variant">{product.process}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <h4 className="mb-1 text-label-md text-coffee-roast">Variedade</h4>
                <p className="text-sm text-on-surface-variant">{product.variety ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <h4 className="mb-1 text-label-md text-coffee-roast">Altitude</h4>
                <p className="text-sm text-on-surface-variant">{product.altitude ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <h4 className="mb-1 text-label-md text-coffee-roast">Região</h4>
                <p className="text-sm text-on-surface-variant">{product.region}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4 col-span-2">
                <h4 className="mb-1 text-label-md text-coffee-roast">Notas sensoriais</h4>
                <p className="text-sm text-on-surface-variant">{product.sensoryNotes}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
