export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

export function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const GRIND_LABELS: Record<string, string> = {
  GRAOS: "Em Grãos",
  ESPRESSO: "Espresso",
  COADO: "Coado",
  PRENSA: "Prensa Francesa",
};

export function weightLabel(grams: number) {
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pagamento confirmado",
  EM_CONFERENCIA: "Em conferência",
  EXPIRADO: "Pix expirado",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  A_CAMINHO: "A caminho",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_BADGE_CLASSES: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "bg-secondary-fixed text-on-secondary-fixed-variant",
  PAGO: "bg-plantation-green/15 text-plantation-green",
  EM_CONFERENCIA: "bg-honey-amber/25 text-on-secondary-container",
  EXPIRADO: "bg-error-container text-on-error-container",
  EM_PREPARO: "bg-honey-amber/20 text-on-secondary-container",
  PRONTO: "bg-tertiary-fixed text-on-tertiary-container",
  A_CAMINHO: "bg-tertiary-fixed text-on-tertiary-container",
  ENTREGUE: "bg-plantation-green/15 text-plantation-green",
  CANCELADO: "bg-error-container text-on-error-container",
};

export const ORDER_STATUS_FLOW = [
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_PREPARO",
  "PRONTO",
  "A_CAMINHO",
  "ENTREGUE",
] as const;
