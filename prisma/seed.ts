import { PrismaClient, Grind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const WEIGHT_MULTIPLIER: Record<number, number> = {
  250: 1,
  500: 1.838,
  1000: 3.372,
};

const GRINDS: Grind[] = ["GRAOS", "ESPRESSO", "COADO", "PRENSA"];
const WEIGHTS = [250, 500, 1000];

function priceForWeight(basePriceCents: number, weight: number) {
  return Math.round(basePriceCents * WEIGHT_MULTIPLIER[weight]);
}

const SHIPPING_ZONES = [
  // Faixa A
  { neighborhood: "Boa Viagem", zone: "A" as const, priceCents: 800, freeThresholdCents: 9000 },
  { neighborhood: "Pina", zone: "A" as const, priceCents: 800, freeThresholdCents: 9000 },
  { neighborhood: "Imbiribeira", zone: "A" as const, priceCents: 800, freeThresholdCents: 9000 },
  { neighborhood: "Setúbal", zone: "A" as const, priceCents: 800, freeThresholdCents: 9000 },
  // Faixa B
  { neighborhood: "Casa Forte", zone: "B" as const, priceCents: 1200, freeThresholdCents: 12000 },
  { neighborhood: "Espinheiro", zone: "B" as const, priceCents: 1200, freeThresholdCents: 12000 },
  { neighborhood: "Graças", zone: "B" as const, priceCents: 1200, freeThresholdCents: 12000 },
  { neighborhood: "Torre", zone: "B" as const, priceCents: 1200, freeThresholdCents: 12000 },
  { neighborhood: "Madalena", zone: "B" as const, priceCents: 1200, freeThresholdCents: 12000 },
  // Faixa C
  { neighborhood: "Olinda", zone: "C" as const, priceCents: 1800, freeThresholdCents: 16000 },
  { neighborhood: "Jaboatão Centro", zone: "C" as const, priceCents: 1800, freeThresholdCents: 16000 },
  { neighborhood: "Camaragibe", zone: "C" as const, priceCents: 1800, freeThresholdCents: 16000 },
].map((z) => ({ ...z, routeDays: "TER,QUI,SAB" }));

const PRODUCTS = [
  {
    slug: "reserva-do-agreste",
    name: "Reserva do Agreste",
    region: "Taquaritinga do Norte, PE",
    sensoryNotes: "Chocolate, Caramelo",
    process: "Natural",
    variety: "Catuaí Amarelo",
    altitude: "900m - 1.000m",
    scaScore: 88,
    basePriceCents: 6490,
    stock: 40,
    description:
      "Um café de corpo encorpado com notas marcantes de chocolate e caramelo, cultivado nas terras altas do Agreste pernambucano.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOeE8RyCTBCR2Kf-ncR7jW5ZbFMn9vqdTAYGNHqCNt5K6TqbL-ZXatoQs525cp4P0eWQr6X7fcM9qnNY80nw1G2rLiDjfKIBLJ013AdNo4PsYnqwTpY7psdug2lPhCAjm98AeTaFJ8dt3DFdFJS7ZUJ7YQJ47gXK20tptQFIT8nBdQW51v0esStNB8_FKGEUE6VI8JseXkuUJrtGYV2AtZ1pibYRaecWJp7tzYrvclALnNaDHAnILXYw",
  },
  {
    slug: "vale-do-sol",
    name: "Vale do Sol",
    region: "Garanhuns, PE",
    sensoryNotes: "Frutado, Cítrico",
    process: "Lavado",
    variety: "Catuaí Vermelho",
    altitude: "850m - 950m",
    scaScore: 85,
    basePriceCents: 7200,
    stock: 0,
    description:
      "Perfil frutado e cítrico, resultado do processo lavado tradicional das lavouras de Garanhuns.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPmvorMrrWQHcqFPgnv4NCqIMNFnP7HOXL47pCG3OG46_2a_cnE6MTbeWNH4oe4-T8Cg0Pudb4OFaAhorDP-NsfwMEcDpEYzeMrg8fNokT65yJajch0T-DwUxHAPQ63Z20RKaFs5py_M977OcjwVuUlFau2WtQAIwOGgG2K1p9cB7oOG0Iw870dsCO_EbWkbHHAYMYiuhrNZnqR5-FYAYpISnkigcWLbThF92bnmb5kLvQokMD6pIBrQ",
  },
  {
    slug: "floral-de-triunfo",
    name: "Floral de Triunfo",
    region: "Triunfo, PE",
    sensoryNotes: "Floral, Jasmim",
    process: "Honey",
    variety: "Catuaí Vermelho 144",
    altitude: "1.100m - 1.250m",
    scaScore: 92,
    basePriceCents: 8900,
    stock: 28,
    description:
      "Delicado e floral, com notas de jasmim. Um lote raro cultivado a mais de 1.100 metros de altitude em Triunfo.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEK_E7GuG1PDt0vMeyde_KchJjN-vUGk0JcMdt60jvCw4Hm_XM1ASlJ3p2LLq6MjFnhIz4Irs47kit4e2FtGfoJ80OLTjztpc5LAISSDrkY0_wZYJ-F_Itjk92vYfXWPXPnk1B-HuFo4ds5srtdfhFDNhQfwjcSigqk68pKx5blXW5rI0KEXAevggW00HxNJHbqyiv34vBlkVd0noEPth0oUlPPFkmj-Vbkz0TlQ8gKTyvl4jAfLm6IA",
  },
  {
    slug: "blend-da-manha",
    name: "Blend da Manhã",
    region: "Brejo Pernambucano, PE",
    sensoryNotes: "Chocolate, Nozes",
    process: "Natural",
    variety: "Blend",
    altitude: "700m - 900m",
    scaScore: 86,
    basePriceCents: 5200,
    stock: 55,
    description:
      "Blend equilibrado do Brejo Pernambucano, com corpo médio e notas de chocolate ao leite e nozes torradas.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbyB7n9nnePqHvHT1YeEggGvKJSpufdI0zNiyVlc0Cvv339M1hnhPTB8m4_HmyRsV7jZcKui6mkK6ZgASmUpkIs0_38a4lzFYhPwXDHLsmHIsw1hMHrundGSANPEjZDFhCLu6EaBJvZik-oHu7e9rL74-Uy9PjX8qbph0jrG8BA9sgc8Q6UVjoUc2TIpae1JKuPbv6Uml_MNPanb8tQa2H5MHzNuHJuPcil4zGTjlhB8J2zESl-gR8rA",
  },
  {
    slug: "reserva-do-sertao",
    name: "Reserva do Sertão",
    region: "Serra da Borborema, PE",
    sensoryNotes: "Melaço de Cana, Castanha",
    process: "Natural e Cereja Descascado",
    variety: "Catuaí Vermelho 144",
    altitude: "1.100m - 1.250m",
    scaScore: 88,
    basePriceCents: 4890,
    stock: 32,
    description:
      "Corpo aveludado com notas de melaço de cana e castanha. Colhido manualmente nas terras altas de Pernambuco.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA02Wy-HGC5vQLCU4kXDqTEk2ReOAxBTaLhAN-iglO9TsTLsFbJQkTTWoMdvmjrwwrbXX2fwdf_rww4YXkqfgoMCrrjQouNjsMcPryNYzYQHnQzTn-B4eBzsE7jaP1L5TcFIRFXcVHRssEgSbghBNgDrfPPvM2LvdVvT1d8zHsnZB7CXdaz9vRQcRvhIYAJ1tPj5aL2cO44m-xL5K_LbcupMpDa-H50a2XjwqVvtbKQzd83IxjAoZZILA",
  },
  {
    slug: "engenho-sao-bento",
    name: "Engenho São Bento",
    region: "São Bento do Una, PE",
    sensoryNotes: "Amêndoas, Mel de Engenho",
    process: "Cereja Descascado",
    variety: "Mundo Novo",
    altitude: "800m - 950m",
    scaScore: 87,
    basePriceCents: 5400,
    stock: 18,
    description:
      "Doçura de mel de engenho com fundo amendoado, herança das tradicionais fazendas de São Bento do Una.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ2CfIkxa9vUvSsbEFsFBBw0_IB8hnnmVC2dhPtu0hweHXDt7GlpBINytiYUvNZW5ZgWWKHR7ohrmrXSgXmsI1HWd_-oBf9zn_HMdXamnzLGDqiWlOQAwpb7BXnJ-uZe6ICh6cvPSwB47YX9tfcE_Lhftcst30C2FpdMvfhpuIW1pOHX475vm04VAmwa90Pe7_zzkIRbc7OKZY4a8aicqoEiw89Tgglwt0GO7hpnEb0iX4KryfK00nUA",
  },
  {
    slug: "blend-recife",
    name: "Blend Recife",
    region: "Blend da Casa — Recife, PE",
    sensoryNotes: "Caramelo, Baunilha",
    process: "Blend de Torras",
    variety: "Blend",
    altitude: "—",
    scaScore: 84,
    basePriceCents: 4290,
    stock: 60,
    description:
      "Nosso blend de entrada, equilibrado e adocicado, pensado para o dia a dia de quem está começando a explorar cafés especiais.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBArMXrBcByHDlWXohwMfFiSs5xqg38Y4px7adj6d7b0XR6ZEAQXN2krbtYkEJe0oJYGmNFeTvkqv0-U8UbrBeGjmctAMeP3xh_hWYhdsXB0aFxX0RgVA98hMBwxelTqg5q4JGciMlfyZRCeOKedrQOal-zL5IVDXebmPW2JsEBwqm0FhAlRj89gjEa_5SaYVgTN_nNeBexW7j7g6yg3KVcHPQn2Euy_D6blN8DJfVsKie_-RYCvcSQLw",
  },
  {
    slug: "catuai-vermelho-cha-grande",
    name: "Catuaí Vermelho",
    region: "Chã Grande, PE",
    sensoryNotes: "Frutas Vermelhas, Especiarias",
    process: "Natural",
    variety: "Catuaí Vermelho",
    altitude: "950m - 1.050m",
    scaScore: 90,
    basePriceCents: 6800,
    stock: 22,
    description:
      "Notas vibrantes de frutas vermelhas e um toque de especiarias, num lote especial de Chã Grande.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3HEzh-9V3nKF1w4hOI4JHevMy1ZdKK2rlUpVjnVBDvItnwRFHmn5V_CNJWUFOO9FrRtVcX4CcmATttwJf843mqSjlvaB2zdjk7ry0Uzy31qkNsBmjcclzcQMJeM4Wis73QqntRBV2ULLbvyYdx0c0jeEAlYenQVUHv_fuOZBO8FJHDRnzzhdB35ZdzToJS0fifK4j3NlQmbifuFUmBPz2xAAFrXX5ZcnwF4xxkwlZX8bJ_80WpspZGQ",
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.user.deleteMany();

  for (const zone of SHIPPING_ZONES) {
    await prisma.shippingZone.create({ data: zone });
  }

  const now = new Date();
  for (const p of PRODUCTS) {
    const lastRoastDate = new Date(now.getTime() - Math.floor(Math.random() * 10) * 86400000);
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        region: p.region,
        sensoryNotes: p.sensoryNotes,
        process: p.process,
        variety: p.variety,
        altitude: p.altitude,
        scaScore: p.scaScore,
        description: p.description,
        imageUrl: p.imageUrl,
        galleryUrls: JSON.stringify([p.imageUrl]),
        lastRoastDate,
        variants: {
          create: WEIGHTS.flatMap((weight) =>
            GRINDS.map((grind) => ({
              weightGrams: weight,
              grind,
              sku: `${p.slug}-${weight}-${grind}`.toUpperCase(),
              priceCents: priceForWeight(p.basePriceCents, weight),
              stockQty: p.stock,
            })),
          ),
        },
      },
    });
  }

  await prisma.coupon.create({
    data: {
      code: "GRAOALTO10",
      percentOff: 10,
      minOrderCents: 5000,
      active: true,
    },
  });

  const passwordHash = await bcrypt.hash("Cafe@1234", 10);
  await prisma.user.create({
    data: {
      name: "Bia (Painel Grão Alto)",
      email: "bia@graoalto.com.br",
      passwordHash,
      phone: "(81) 99999-0000",
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      name: "Cliente Teste",
      email: "cliente@exemplo.com",
      passwordHash,
      phone: "(81) 98888-1234",
      cpf: "123.456.789-00",
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Seed concluído.");
  console.log("Login admin: bia@graoalto.com.br / Cafe@1234");
  console.log("Login cliente: cliente@exemplo.com / Cafe@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
