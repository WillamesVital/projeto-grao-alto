import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import ProductVariantSelector from "@/components/product-variant-selector";
import ProductGallery from "@/components/product-gallery";
import ProductTabs from "@/components/product-tabs";

const BEANS_MACRO_PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8pne6uYns1jraDmV-akv_55_doF3JtKNAkPnRZ7Ll38-jVDJp-IvmRWqjwolrOfjeyJUrN6XuoZTIB-8oMp04j_rUmtapMfWPqwP4_8Olg7iDyEo5jMRqAX8Pj7-7TQ8Eb5F7-jZrAVU3H-IquijUvPsNKGMDQcpgL7maukYe5zamFHgkMlcvqLdjQeMOL1UfJ16nlEr3ZhOxu3kQlrk5rTT7Ku6udWrK2_fSiS4EsMmA923MavHR_Q";
const MUG_LIFESTYLE_PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAaeLrEgaV1-iKedilkqtfm5wRB7vbf8IkDxLYKCJEdyHl9eptcDJEkOoGjrKOAbiU8M29AHPJ1vo5sBH4euTSrqlgKZcGcWWv-pBXjUjkKG7E5nl0igWeEIw68wwwj3dFNHp2ufLpSDJQrr2rdO1atDaUoTCTnIxy6Zsrpx93FFhW7KcJQUfKxzTIPxSUdBwpnuK107vVeWsEu_zpy0SdSQTOdK6qkJ6t7wlDbAcZX0lDJSDQM4s0DJA";
const BREW_PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB8YGnRj_xTheDC9zqTrHfSoi-ASHUGsaEtOnKWLHDqHMPJWQy0juhBcqflZaV5JbFQDfziuDTLsmzC6d0aa5VR2gJl8jVmvplE_f4KqAj2-f5e7c3BH28y4N3wShgX7jjEtn8dkdpm9E80QfnbKlk-qWPKi8Mpq7NH5_BpiC3GFPciNrs16BTpgrEAF_cL86I6lbesrimmDrAi0VHzSjwYhnwfnqQnUXSnC7OXmgc74y1oocp2WiHjSQ";

/** Preenche a galeria com fotos genéricas do ritual do café quando o produto
 * só tem uma imagem cadastrada — puramente decorativo, sem afirmar detalhe
 * específico do lote. */
function buildGalleryImages(product: { imageUrl: string; galleryUrls: string }): string[] {
  let parsed: string[] = [];
  try {
    const raw = JSON.parse(product.galleryUrls);
    if (Array.isArray(raw)) parsed = raw.filter((v): v is string => typeof v === "string");
  } catch {
    parsed = [];
  }
  const unique = Array.from(new Set([product.imageUrl, ...parsed]));
  if (unique.length > 1) return unique;
  return [...unique, BEANS_MACRO_PHOTO, MUG_LIFESTYLE_PHOTO];
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const galleryImages = buildGalleryImages(product);

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-8 md:px-margin-desktop md:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery images={galleryImages} alt={product.name} scaScore={product.scaScore} />
        </div>

        <div className="flex flex-col lg:col-span-5">
          <nav className="mb-4 flex items-center gap-2 text-label-sm text-on-surface-variant">
            <Link href="/" className="hover:text-coffee-roast">
              Cafés
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="font-bold text-coffee-roast">{product.name}</span>
          </nav>
          <h1 className="font-display mb-2 text-headline-lg text-coffee-roast">{product.name}</h1>

          <ProductVariantSelector
            variants={product.variants}
            productId={product.id}
            defaultEmail={user?.email}
          />

          <p className="mt-8 leading-relaxed text-body-md text-on-surface-variant">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-6 border-t border-outline-variant/20 py-6">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-plantation-green">local_shipping</span>
              <span className="text-label-sm">Frete grátis por faixa de bairro</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-plantation-green">verified</span>
              <span className="text-label-sm">Torra: {formatDate(product.lastRoastDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <ProductTabs
        description={product.description}
        storyTitle={product.storyTitle}
        storyBody={product.storyBody}
        brewPhotoUrl={BREW_PHOTO}
        processInfo={[
          { label: "Processo", value: product.process },
          { label: "Variedade", value: product.variety ?? "—" },
          { label: "Altitude", value: product.altitude ?? "—" },
          { label: "Região", value: product.region },
          { label: "Notas sensoriais", value: product.sensoryNotes, wide: true },
        ]}
      />
    </div>
  );
}
