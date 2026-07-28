import { describe, it, expect } from "vitest";
import { authorizeCardCharge, generatePixCharge } from "@/lib/payment-gateway";

describe("authorizeCardCharge", () => {
  it("aprova um cartão de teste válido", () => {
    const result = authorizeCardCharge({
      cardNumber: "4111 1111 1111 1111",
      installments: 1,
      amountCents: 10000,
    });
    expect(result.approved).toBe(true);
  });

  it("recusa cartão de teste terminado em 0002", () => {
    const result = authorizeCardCharge({
      cardNumber: "4111 1111 1111 0002",
      installments: 1,
      amountCents: 10000,
    });
    expect(result.approved).toBe(false);
  });

  it("recusa parcela abaixo do mínimo de R$ 40,00", () => {
    const result = authorizeCardCharge({
      cardNumber: "4111 1111 1111 1111",
      installments: 3,
      amountCents: 6000, // R$20,00 por parcela
    });
    expect(result.approved).toBe(false);
    if (!result.approved) expect(result.reason).toMatch(/mínimo/i);
  });

  it("recusa parcelamento acima de 3x", () => {
    const result = authorizeCardCharge({
      cardNumber: "4111 1111 1111 1111",
      installments: 4,
      amountCents: 100000,
    });
    expect(result.approved).toBe(false);
  });
});

describe("generatePixCharge", () => {
  it("gera cobrança com expiração de 30 minutos no futuro", async () => {
    const charge = await generatePixCharge("GA-1234567", 10000);
    const diffMinutes = (charge.expiresAt.getTime() - Date.now()) / 60000;
    expect(diffMinutes).toBeGreaterThan(29);
    expect(diffMinutes).toBeLessThanOrEqual(30);
    expect(charge.pixCode).toBeTruthy();
    expect(charge.gatewayTransactionId).toMatch(/^pix_/);
  });
});
