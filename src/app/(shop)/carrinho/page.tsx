import Link from "next/link";
import { getCart, cartTotals } from "@/lib/cart";
import CartItemRow from "@/components/cart-item-row";
import CartSummary from "@/components/cart-summary";

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
                currentPriceCents={item.productVariant.priceCents}
                outOfStockFlag={item.outOfStockFlag}
              />
            ))}
          </div>

          <aside className="sticky top-24 lg:col-span-4">
            <CartSummary subtotalCents={subtotalCents} hasOutOfStock={hasOutOfStock} />
          </aside>
        </div>
      )}
    </div>
  );
}
