import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCart, cartTotals } from "@/lib/cart";
import { ensureCheckoutLockAction } from "@/actions/checkout";
import CheckoutForm from "@/components/checkout-form";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const cart = await getCart();
  if (cart.items.length === 0) redirect("/carrinho");
  if (cart.items.some((i) => i.outOfStockFlag)) redirect("/carrinho");

  const idempotencyKey = await ensureCheckoutLockAction();

  const subtotalCents = cartTotals(cart);

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-12 md:px-margin-desktop">
      <div className="mb-8 flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          lock
        </span>
        <span className="text-label-md">Checkout simulado (curso) — nenhuma cobrança real</span>
      </div>

      <CheckoutForm
        idempotencyKey={idempotencyKey}
        subtotalCents={subtotalCents}
        defaultEmail={user.email}
        defaultCpf={user.cpf ?? ""}
        items={cart.items.map((i) => ({
          id: i.id,
          name: i.product.name,
          imageUrl: i.product.imageUrl,
          weightGrams: i.productVariant.weightGrams,
          grind: i.productVariant.grind,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        }))}
        totalWeightGrams={cart.items.reduce(
          (sum, i) => sum + i.quantity * i.productVariant.weightGrams,
          0,
        )}
      />
    </div>
  );
}
