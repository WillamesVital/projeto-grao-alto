import Link from "next/link";

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile py-16 md:px-margin-desktop">
      <p className="mb-2 text-label-sm tracking-widest text-honey-amber uppercase">Nossa história</p>
      <h1 className="font-display mb-8 text-headline-lg text-coffee-roast">
        Da serra de Pernambuco para a sua xícara
      </h1>

      <div className="space-y-6 text-body-lg text-on-surface-variant">
        <p>
          A Grão Alto nasceu do trabalho do Sr. Antônio e de gerações de produtores nas terras altas de
          Pernambuco. Cada lote é colhido, processado e torrado em pequena escala, priorizando a
          complexidade sensorial do grão sobre o volume.
        </p>
        <p>
          Torramos toda semana e registramos a data da última torra em cada produto — porque café
          especial se degrada com o tempo, e transparência sobre isso faz parte do nosso compromisso
          com quem bebe.
        </p>
        <p>
          Hoje entregamos em Recife e região com rota própria, e para o resto do Brasil pelos Correios.
          Continuamos atendendo pelo WhatsApp quem prefere esse caminho — o site existe para dar mais
          autonomia a quem já é nosso cliente, não para substituir a relação.
        </p>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-lg bg-coffee-roast px-6 py-3 font-bold text-white hover:bg-honey-amber"
      >
        Ver nossos cafés
        <span className="material-symbols-outlined">arrow_forward</span>
      </Link>
    </div>
  );
}
