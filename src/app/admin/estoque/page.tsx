import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GRIND_LABELS, weightLabel } from "@/lib/format";

/** RN-413.10: saldo atual de cada rótulo, em gramas — o que a expedição
 * precisa para saber se fecha um pedido sem abrir novo saco de grão. */
export default async function AdminStockPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: { orderBy: [{ weightGrams: "asc" }, { grind: "asc" }] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-10 md:px-margin-desktop">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-label-md text-coffee-roast hover:text-honey-amber">
        <span className="material-symbols-outlined">arrow_back</span>
        Pedidos
      </Link>
      <h1 className="font-display mb-8 text-headline-lg text-coffee-roast">Estoque por rótulo</h1>

      <div className="space-y-8">
        {products.map((product) => {
          const totalGrams = product.variants.reduce((sum, v) => sum + v.stockQty * v.weightGrams, 0);
          return (
            <div key={product.id} className="rounded-lg border border-outline-variant/10 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-title-lg text-coffee-roast">{product.name}</h2>
                <span className="text-label-sm font-bold text-on-surface-variant">
                  Total em estoque: {(totalGrams / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-md">
                  <thead className="text-label-sm tracking-wider text-on-surface-variant uppercase">
                    <tr>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Peso</th>
                      <th className="py-2 pr-4">Moagem</th>
                      <th className="py-2 pr-4">Unidades</th>
                      <th className="py-2 pr-4">Gramas em estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {product.variants.map((v) => (
                      <tr key={v.id} className={v.stockQty <= 0 ? "text-error-red" : ""}>
                        <td className="py-2 pr-4 text-label-sm text-on-surface-variant">{v.sku}</td>
                        <td className="py-2 pr-4">{weightLabel(v.weightGrams)}</td>
                        <td className="py-2 pr-4">{GRIND_LABELS[v.grind]}</td>
                        <td className="py-2 pr-4 font-bold">{v.stockQty}</td>
                        <td className="py-2 pr-4">{(v.stockQty * v.weightGrams).toLocaleString("pt-BR")} g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
