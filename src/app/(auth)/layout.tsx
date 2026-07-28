import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="mx-auto flex h-20 w-full max-w-(--container-max) items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="font-display text-headline-md font-bold text-coffee-roast">
          Grão Alto
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-label-md text-on-surface-variant transition-colors hover:text-coffee-roast"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Voltar para a loja
        </Link>
      </nav>
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/4 -translate-y-1/2 rounded-full bg-secondary-fixed/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] -translate-x-1/4 translate-y-1/2 rounded-full bg-primary-fixed/30 blur-3xl" />
        {children}
      </main>
    </>
  );
}
