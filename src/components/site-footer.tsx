import Link from "next/link";
import NewsletterForm from "@/components/newsletter-form";

export default function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-on-primary">
      <div className="mx-auto grid max-w-(--container-max) grid-cols-1 gap-gutter px-margin-mobile py-16 md:grid-cols-4 md:px-margin-desktop">
        <div className="md:col-span-1">
          <div className="font-display text-headline-md mb-4">Grão Alto</div>
          <p className="mb-4 text-body-md opacity-80">
            O melhor do café artesanal pernambucano diretamente para sua casa.
          </p>
          <p className="text-body-md opacity-80">contato@graoalto.com.br</p>
          <p className="mb-4 text-body-md opacity-80">Recife, Pernambuco</p>
          <div className="flex gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
              <span className="material-symbols-outlined text-[18px]">language</span>
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
              <span className="material-symbols-outlined text-[18px]">share</span>
            </span>
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Explore
          </h4>
          <ul className="space-y-2 text-body-md opacity-90">
            <li>
              <Link href="/" className="hover:underline">
                Cafés
              </Link>
            </li>
            <li>
              <Link href="/acessorios" className="hover:underline">
                Acessórios
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:underline">
                Sobre
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Suporte
          </h4>
          <ul className="space-y-2 text-body-md opacity-90">
            <li>
              <Link href="/sobre" className="hover:underline">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:underline">
                Trocas e Devoluções
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:underline">
                Privacidade
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-label-md font-bold tracking-widest uppercase opacity-60">
            Newsletter
          </h4>
          <p className="mb-4 text-body-md opacity-80">Receba dicas de preparo e novidades sobre novas torras.</p>
          <NewsletterForm />
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
