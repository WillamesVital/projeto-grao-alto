import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { getCart } from "@/lib/cart";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cart = await getCart();
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <SiteHeader cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
