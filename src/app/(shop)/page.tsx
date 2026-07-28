import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import ProductCard from "@/components/product-card";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = await listProducts(q);

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-12 md:px-margin-desktop">
      <section className="mb-12">
        <h1 className="font-display mb-4 text-headline-lg text-coffee-roast">Nossa Coleção</h1>
        <p className="max-w-2xl text-body-lg text-on-surface-variant">
          Explore grãos selecionados das melhores fazendas de Pernambuco. Torras frescas semanais
          para garantir a complexidade sensorial em cada xícara.
        </p>
      </section>

      {q && (
        <p className="mb-6 text-body-md text-on-surface-variant">
          {results.length > 0
            ? `${results.length} resultado(s) para "${q}"`
            : `Nenhum resultado para "${q}".`}{" "}
          <Link href="/" className="font-bold text-coffee-roast hover:text-honey-amber">
            Ver todos os cafés
          </Link>
        </p>
      )}

      {results.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-12 text-center">
          <p className="mb-2 text-title-lg text-coffee-roast">Não encontramos esse café.</p>
          <p className="text-body-md text-on-surface-variant">
            Tente buscar pelo nome do rótulo (ex: &quot;Reserva&quot;) ou por uma nota sensorial (ex:
            &quot;chocolate&quot;, &quot;floral&quot;).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map(({ product, defaultVariant, soldOut }) => (
            <ProductCard
              key={product.id}
              product={product}
              defaultVariant={defaultVariant}
              soldOut={soldOut}
            />
          ))}
        </div>
      )}
    </div>
  );
}
