import { randomUUID } from "crypto";

/**
 * Gateway de pagamento SIMULADO. Este é um projeto de curso — não há
 * integração real com Pix ou adquirente de cartão. A interface (idempotência,
 * autorização/captura, expiração, webhook) imita como um gateway de verdade
 * funcionaria, para que trocar por um provedor real seja só reimplementar
 * este arquivo.
 */

export const PIX_EXPIRATION_MINUTES = 30;
export const MIN_INSTALLMENT_CENTS = 4000;
export const MAX_INSTALLMENTS = 3;

export async function generatePixCharge(orderNumber: string, amountCents: number) {
  const gatewayTransactionId = `pix_${randomUUID()}`;
  const pixCode = [
    "00020126", // payload simulado no formato visual de um BR Code
    Buffer.from(`GRAOALTO*${orderNumber}*${amountCents}*${gatewayTransactionId}`).toString("hex").slice(0, 40),
    "5204000053039865802BR5913GRAOALTOCAFE6009RECIFE",
  ].join("");

  return {
    gatewayTransactionId,
    pixCode,
    expiresAt: new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000),
  };
}

export type CardChargeInput = {
  cardNumber: string;
  installments: number;
  amountCents: number;
};

export type CardChargeResult =
  | { approved: true; gatewayTransactionId: string; last4: string }
  | { approved: false; reason: string };

/**
 * Autorização de cartão simulada. Para permitir testar o caminho de recusa
 * de forma determinística, qualquer número de teste terminado em "0002"
 * é sempre recusado (convenção comum de sandboxes de gateway).
 */
export function authorizeCardCharge(input: CardChargeInput): CardChargeResult {
  const digits = input.cardNumber.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";

  if (input.installments > MAX_INSTALLMENTS) {
    return { approved: false, reason: "Parcelamento máximo é 3x sem juros." };
  }
  if (input.amountCents / input.installments < MIN_INSTALLMENT_CENTS) {
    return { approved: false, reason: "Valor da parcela abaixo do mínimo de R$ 40,00." };
  }
  if (digits.endsWith("0002")) {
    return { approved: false, reason: "Cartão recusado pela operadora. Tente outro cartão ou use Pix." };
  }
  if (digits.length < 13) {
    return { approved: false, reason: "Número de cartão inválido." };
  }

  return { approved: true, gatewayTransactionId: `card_${randomUUID()}`, last4 };
}
