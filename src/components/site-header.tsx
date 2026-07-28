import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import SearchBox from "@/components/search-box";

export default async function SiteHeader({ cartCount }: { cartCount: number }) {
  const user = await getCurrentUser();

  return (
    <header className="bg-paper-offwhite sticky top-0 z-40 w-full border-b border-outline-variant/20">
      <div className="mx-auto flex h-20 max-w-(--container-max) items-center justify-between gap-6 px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-display text-headline-md font-bold text-coffee-roast">
            Grão Alto
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link href="/" className="border-b-2 border-coffee-roast pb-1 text-label-md font-bold text-coffee-roast">
              Cafés
            </Link>
            <Link href="/acessorios" className="text-label-md text-on-surface-variant transition-colors hover:text-coffee-roast">
              Acessórios
            </Link>
            <Link href="/sobre" className="text-label-md text-on-surface-variant transition-colors hover:text-coffee-roast">
              Sobre
            </Link>
            <Link href="/pedidos" className="text-label-md text-on-surface-variant transition-colors hover:text-coffee-roast">
              Meus Pedidos
            </Link>
          </nav>
        </div>

        <div className="hidden flex-1 max-w-md md:block">
          <SearchBox />
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/carrinho"
            className="relative rounded-full p-2 text-coffee-roast transition-colors hover:bg-surface-container-low"
            aria-label="Ver carrinho"
          >
            <span className="material-symbols-outlined">shopping_basket</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-honey-amber text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-label-sm text-on-surface-variant">Olá, {user.name.split(" ")[0]}</span>
              <form action={logoutAction}>
                <button className="text-label-sm font-bold text-coffee-roast hover:text-honey-amber" type="submit">
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex items-center rounded-lg border-2 border-coffee-roast px-4 py-2 text-label-md font-bold text-coffee-roast transition-colors hover:bg-coffee-roast hover:text-white"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
      <div className="px-margin-mobile pb-3 md:hidden">
        <SearchBox />
      </div>
    </header>
  );
}
