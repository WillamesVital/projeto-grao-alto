import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <>
      <header className="border-b border-outline-variant/20 bg-coffee-roast text-white">
        <div className="mx-auto flex h-16 max-w-(--container-max) items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-title-lg font-bold">
              Grão Alto · Painel da Bia
            </Link>
          </div>
          <div className="flex items-center gap-4 text-label-md">
            <span className="opacity-80">Olá, {user.name.split(" ")[0]}</span>
            <form action={logoutAction}>
              <button type="submit" className="font-bold hover:text-honey-amber">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-surface-container-low">{children}</main>
    </>
  );
}
