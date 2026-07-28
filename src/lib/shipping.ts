import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/text";

export type ShippingZoneInfo = {
  neighborhood: string;
  zone: "A" | "B" | "C";
  priceCents: number;
  freeThresholdCents: number | null;
  routeDays: string;
};

export type ShippingOption = {
  id: "DELIVERY_OWN" | "CORREIOS" | "PICKUP";
  zoneCode: "A" | "B" | "C" | "FORA_DA_AREA" | null;
  label: string;
  etaLabel: string;
  priceCents: number;
  isFree: boolean;
};

const ROUTE_DAY_LABELS: Record<string, string> = {
  TER: "terça",
  QUI: "quinta",
  SAB: "sábado",
};

function routeDaysLabel(routeDays: string) {
  return routeDays
    .split(",")
    .map((d) => ROUTE_DAY_LABELS[d] ?? d)
    .join(", ");
}

/**
 * Regra de negócio central do frete (GA-405). Frete grátis SÓ existe para
 * bairros cadastrados nas faixas A/B/C, e só quando o subtotal atinge o
 * limite daquela faixa. Bairro que não está na tabela é "fora da área" e
 * NUNCA recebe frete grátis — essa distinção é o que evita a regressão do
 * GA-412 (frete grátis fora da área de entrega).
 */
export function resolveOwnFleetShipping(
  zone: ShippingZoneInfo,
  subtotalCents: number,
): ShippingOption {
  const isFree = zone.freeThresholdCents != null && subtotalCents >= zone.freeThresholdCents;
  return {
    id: "DELIVERY_OWN",
    zoneCode: zone.zone,
    label: `Entrega própria — Faixa ${zone.zone} (${zone.neighborhood})`,
    etaLabel: `Rota nas ${routeDaysLabel(zone.routeDays)}, 14h–19h. Pago até 11h entra na rota do mesmo dia.`,
    priceCents: isFree ? 0 : zone.priceCents,
    isFree,
  };
}

/**
 * Cotação simulada dos Correios para fora da área de cobertura própria.
 * Nunca é grátis, em nenhum valor — mesmo que o pedido seja grande.
 */
export function resolveCorreiosShipping(totalWeightGrams: number): ShippingOption {
  const baseCents = 1500;
  const extraSteps = Math.max(0, Math.ceil((totalWeightGrams - 250) / 250));
  const priceCents = baseCents + extraSteps * 300;
  return {
    id: "CORREIOS",
    zoneCode: "FORA_DA_AREA",
    label: "Correios (fora da área de entrega própria)",
    etaLabel: "Prazo do transportador + 1 dia útil de preparo. Sem frete grátis, em nenhum valor.",
    priceCents,
    isFree: false,
  };
}

export function resolvePickupShipping(): ShippingOption {
  return {
    id: "PICKUP",
    zoneCode: null,
    label: "Retirada na loja",
    etaLabel: "Pronto em 4h úteis. Guardado por 5 dias.",
    priceCents: 0,
    isFree: true,
  };
}

/** Busca a faixa de frete própria por nome de bairro, sem acento e sem diferenciar maiúscula. */
export async function findShippingZoneByNeighborhood(
  neighborhood: string,
): Promise<ShippingZoneInfo | null> {
  const zones = await prisma.shippingZone.findMany({ where: { active: true } });
  const normalized = normalizeText(neighborhood);
  const match = zones.find((z) => normalizeText(z.neighborhood) === normalized);
  if (!match) return null;
  return {
    neighborhood: match.neighborhood,
    zone: match.zone as "A" | "B" | "C",
    priceCents: match.priceCents,
    freeThresholdCents: match.freeThresholdCents,
    routeDays: match.routeDays,
  };
}

export async function listShippingZones(): Promise<ShippingZoneInfo[]> {
  const zones = await prisma.shippingZone.findMany({
    where: { active: true },
    orderBy: { zone: "asc" },
  });
  return zones.map((z) => ({
    neighborhood: z.neighborhood,
    zone: z.zone as "A" | "B" | "C",
    priceCents: z.priceCents,
    freeThresholdCents: z.freeThresholdCents,
    routeDays: z.routeDays,
  }));
}

export async function quoteDeliveryOptions(params: {
  neighborhood: string;
  subtotalCents: number;
  totalWeightGrams: number;
}): Promise<{ recommended: ShippingOption; alternatives: ShippingOption[] }> {
  const zone = await findShippingZoneByNeighborhood(params.neighborhood);
  const pickup = resolvePickupShipping();

  if (zone) {
    const ownFleet = resolveOwnFleetShipping(zone, params.subtotalCents);
    return { recommended: ownFleet, alternatives: [pickup] };
  }

  const correios = resolveCorreiosShipping(params.totalWeightGrams);
  return { recommended: correios, alternatives: [pickup] };
}
