import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/text";
import { Grind } from "@prisma/client";

export const DEFAULT_WEIGHT = 250;
export const DEFAULT_GRIND: Grind = "GRAOS";

export async function listProducts(query?: string) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true },
    orderBy: { createdAt: "asc" },
  });

  const normalizedQuery = query ? normalizeText(query) : "";

  const withDefaults = products.map((product) => {
    const defaultVariant =
      product.variants.find((v) => v.weightGrams === DEFAULT_WEIGHT && v.grind === DEFAULT_GRIND) ??
      product.variants[0];
    const totalStock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);
    return { product, defaultVariant, totalStock, soldOut: totalStock <= 0 };
  });

  if (!normalizedQuery) return withDefaults;

  return withDefaults.filter(
    ({ product }) =>
      normalizeText(product.name).includes(normalizedQuery) ||
      normalizeText(product.sensoryNotes).includes(normalizedQuery) ||
      normalizeText(product.region).includes(normalizedQuery),
  );
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });
  return product;
}
