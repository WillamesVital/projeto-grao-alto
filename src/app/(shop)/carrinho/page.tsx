import Link from "next/link";
import { getCart, cartTotals } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import CartItemRow from "@/components/cart-item-row";

export default async function CartPage() {
  const cart = await getCart();
  const subtotalCents = cartTotals(cart);
  const hasOutOfStock = cart.items.some((i) => i.outOfStockFlag);

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-12 md:px-margin-desktop">
      <header className="mb-12">
        <h1 className="font-display text-headline-lg text-coffee-roast">Seu Carrinho</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Você selecionou cafés artesanais de alta qualidade.
        </p>
      </header>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-16 text-center">
          <p className="mb-4 text-title-lg text-coffee-roast">Seu carrinho está vazio.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-coffee-roast px-6 py-3 font-bold text-white hover:bg-honey-amber"
          >
            Explorar cafés
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                id={item.id}
                name={item.product.name}
                imageUrl={item.product.imageUrl}
                sensoryNotes={item.product.sensoryNotes}
                weightGrams={item.productVariant.weightGrams}
                grind={item.productVariant.grind}
                quantity={item.quantity}
                unitPriceCents={item.unitPriceCents}
                outOfStockFlag={item.outOfStockFlag}
              />
            ))}
          </div>

          <aside className="sticky top-24 lg:col-span-4">
            <div className="rounded-lg border border-outline-variant/10 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(39,19,16,0.06)] md:p-8">
              <h2 className="font-display mb-6 text-headline-md text-coffee-roast">Resumo</h2>
              <div className="mb-8 space-y-4">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-medium text-on-surface">{formatBRL(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Frete</span>
                  <span className="text-label-sm">calculado no checkout</span>
                </div>
              </div>

              {hasOutOfStock && (
                <p className="mb-4 rounded-lg bg-error-container px-4 py-3 text-label-sm text-on-error-container">
                  Remova os itens esgotados para continuar.
                </p>
              )}

              <Link
                href={hasOutOfStock ? "#" : "/checkout"}
                aria-disabled={hasOutOfStock}
                className={`flex w-full items-center justify-center gap-2 rounded py-4 text-title-lg transition-all active:scale-95 ${
                  hasOutOfStock
                    ? "pointer-events-none cursor-not-allowed bg-surface-variant text-on-surface-variant"
                    : "bg-coffee-roast text-on-primary hover:bg-honey-amber"
                }`}
              >
                Finalizar Compra
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <div className="mt-6 flex items-center justify-center gap-2 text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Pagamento simulado (curso) — nenhuma cobrança real
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
