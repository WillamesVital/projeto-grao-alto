import type { ShippingZoneCode } from "@prisma/client";

const ALL_ZONES: ShippingZoneCode[] = ["A", "B", "C", "FORA_DA_AREA"];

/**
 * GA-409: rollout do checkout por faixa de bairro. Sem `CHECKOUT_ENABLED_ZONES`
 * configurada, todas as faixas ficam liberadas (comportamento atual,
 * inalterado) — a variável é o mecanismo de desligar rapidamente uma faixa
 * problemática sem depender de deploy (RN-409.2/RN-409.6).
 */
export function getEnabledCheckoutZones(): ShippingZoneCode[] {
  const raw = process.env.CHECKOUT_ENABLED_ZONES;
  if (!raw?.trim()) return ALL_ZONES;
  const zones = raw
    .split(",")
    .map((z) => z.trim().toUpperCase())
    .filter((z): z is ShippingZoneCode => (ALL_ZONES as string[]).includes(z));
  return zones.length > 0 ? zones : ALL_ZONES;
}

export function isCheckoutEnabledForZone(zoneCode: ShippingZoneCode | null): boolean {
  // Retirada na loja (zoneCode null) nunca é bloqueada pela flag de bairro.
  if (zoneCode === null) return true;
  return getEnabledCheckoutZones().includes(zoneCode);
}

export function checkoutFlagSnapshot(): string {
  return getEnabledCheckoutZones().join(",");
}
