export default function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-on-primary">
      <div className="mx-auto grid max-w-(--container-max) grid-cols-1 gap-gutter px-margin-mobile py-16 md:grid-cols-4 md:px-margin-desktop">
        <div className="md:col-span-1">
          <div className="font-display text-headline-md mb-4">Grão Alto</div>
          <p className="text-body-md opacity-80">
            O melhor do café artesanal pernambucano diretamente para sua casa.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Explore
          </h4>
          <ul className="space-y-2 text-body-md opacity-90">
            <li>Cafés</li>
            <li>Acessórios</li>
            <li>Assinaturas</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Suporte
          </h4>
          <ul className="space-y-2 text-body-md opacity-90">
            <li>FAQ</li>
            <li>Trocas e Devoluções</li>
            <li>Privacidade</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Contato
          </h4>
          <p className="text-body-md opacity-90">contato@graoalto.com.br</p>
          <p className="text-body-md opacity-90">Recife, Pernambuco</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-label-sm text-on-primary-fixed-variant opacity-70">
          © 2026 Grão Alto Cafés Especiais. Pernambuco, Brasil.
        </p>
      </div>
    </footer>
  );
}
