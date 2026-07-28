import Link from "next/link";

export default function AcessoriosPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-margin-mobile py-24 text-center md:px-margin-desktop">
      <span className="material-symbols-outlined mb-6 text-5xl text-honey-amber">coffee_maker</span>
      <h1 className="font-display mb-4 text-headline-lg text-coffee-roast">Acessórios chegando em breve</h1>
      <p className="mb-10 text-body-lg text-on-surface-variant">
        Estamos preparando uma seleção de coadores, droppers e balanças para completar o seu ritual de
        preparo. Enquanto isso, confira nossos cafés especiais.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-coffee-roast px-6 py-3 font-bold text-white hover:bg-honey-amber"
      >
        Ver nossos cafés
        <span className="material-symbols-outlined">arrow_forward</span>
      </Link>
    </div>
  );
}
