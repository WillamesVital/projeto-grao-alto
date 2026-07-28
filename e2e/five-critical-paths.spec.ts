import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

/**
 * Os 5 caminhos E2E automatizados definidos na seção 8 do
 * docs/escopo-mvp-grao-alto.md. A escolha é deliberada: só estes 5, porque
 * "automação custa manutenção" — uma suíte inchada morre na terceira sprint
 * num time de dois devs.
 */

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1000)}@exemplo.com`;
}

// A conta compartilhada usada pelos testes 2, 3 e 4 precisa começar cada
// execução com o carrinho vazio, senão pedidos de execuções anteriores
// deixam o teste dependente de estado (o oposto de um E2E confiável).
async function resetSharedAccountCart() {
  const user = await prisma.user.findUnique({ where: { email: "cliente@exemplo.com" } });
  if (!user) return;
  const carts = await prisma.cart.findMany({ where: { userId: user.id } });
  for (const cart of carts) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}

test.describe.serial("5 caminhos críticos do MVP", () => {
  test.beforeEach(async () => {
    await resetSharedAccountCart();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("1. Cadastro → compra com Pix → entrega faixa A", async ({ page }) => {
    const email = uniqueEmail("pix-faixa-a");

    await page.goto("/cadastro", { waitUntil: "domcontentloaded" });
    await page.fill("#name", "Cliente Faixa A");
    await page.fill("#email", email);
    await page.fill("#password", "SenhaForte123");
    await page.fill("#phone", "81999990001");
    await page.click("button[type=submit]");
    await expect(page.getByRole("heading", { name: "Verifique seu e-mail" })).toBeVisible();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", email);
    await page.fill("#password", "SenhaForte123");
    await page.click("button[type=submit]");
    await page.waitForURL("**/");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("a:has-text('Ver detalhes')").first().click();
    await page.click("text=ADICIONAR AO CARRINHO");
    await expect(page.getByText("Adicionado ao carrinho!").first()).toBeVisible();

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.fill("input[name=cpf]", "123.456.789-00");
    await page.fill("input[name=street]", "Rua das Flores");
    await page.fill("input[name=number]", "100");
    await page.fill("input[name=neighborhood]", "Boa Viagem");
    await page.fill("input[name=city]", "Recife");
    await page.fill("input[name=state]", "PE");
    await expect(page.getByText("Faixa A").first()).toBeVisible({ timeout: 8000 });

    await page.click("button:has-text('Pix')");
    await page.click("button:has-text('Finalizar Pedido')");
    await page.waitForURL("**/checkout/pix/**");

    await page.click("text=Já paguei (simular webhook)");
    await page.waitForURL("**/pedido-confirmado/**");
    await expect(page.getByText("Pedido Confirmado!").first()).toBeVisible();
  });

  test("2. Login → compra com cartão → fora da área", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", "cliente@exemplo.com");
    await page.fill("#password", "Cafe@1234");
    await page.click("button[type=submit]");
    await page.waitForURL("**/");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("a:has-text('Ver detalhes')").nth(2).click();
    await page.click("text=ADICIONAR AO CARRINHO");
    await expect(page.getByText("Adicionado ao carrinho!").first()).toBeVisible();

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.fill("input[name=cpf]", "123.456.789-00");
    await page.fill("input[name=street]", "Rua Sem Nome");
    await page.fill("input[name=number]", "50");
    await page.fill("input[name=neighborhood]", "Bairro Fora Da Área De Cobertura");
    await page.fill("input[name=city]", "Vitória de Santo Antão");
    await page.fill("input[name=state]", "PE");

    // Fora da área: precisa cair no Correios, nunca em frete grátis (GA-412).
    await expect(page.getByText("Correios").first()).toBeVisible({ timeout: 8000 });
    const freeShipping = await page.getByText("Grátis", { exact: true }).count();
    expect(freeShipping).toBe(0);

    await page.click("button:has-text('Cartão de Crédito')");
    await page.fill("input[name=cardNumber]", "4111 1111 1111 1111");
    await page.fill("input[name=cardName]", "Cliente Teste");
    await page.fill("input[name=cardExpiry]", "12/30");
    await page.fill("input[name=cardCvv]", "123");

    await page.click("button:has-text('Finalizar Pedido')");
    await page.waitForURL("**/pedido-confirmado/**", { timeout: 15000 });
    await expect(page.getByText("Pedido Confirmado!").first()).toBeVisible();
  });

  test("3. Compra com retirada na loja", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", "cliente@exemplo.com");
    await page.fill("#password", "Cafe@1234");
    await page.click("button[type=submit]");
    await page.waitForURL("**/");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("a:has-text('Ver detalhes')").first().click();
    await page.click("text=ADICIONAR AO CARRINHO");
    await expect(page.getByText("Adicionado ao carrinho!").first()).toBeVisible();

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.fill("input[name=cpf]", "123.456.789-00");
    await page.click("button:has-text('Retirar na loja')");
    await expect(page.getByText("Retirada na loja").first()).toBeVisible();
    await expect(page.getByText("Grátis").first()).toBeVisible();

    await page.click("button:has-text('Pix')");
    await page.click("button:has-text('Finalizar Pedido')");
    await page.waitForURL("**/checkout/pix/**");
    await page.click("text=Já paguei (simular webhook)");
    await page.waitForURL("**/pedido-confirmado/**");
    await expect(page.getByText("Retirada na loja").first()).toBeVisible();
  });

  test("4. Carrinho com múltiplos itens e moagens diferentes", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill("#email", "cliente@exemplo.com");
    await page.fill("#password", "Cafe@1234");
    await page.click("button[type=submit]");
    await page.waitForURL("**/");

    await page.goto("/produtos/reserva-do-agreste", { waitUntil: "domcontentloaded" });
    await page.click("button:has-text('Em Grãos')");
    await page.click("text=ADICIONAR AO CARRINHO");
    await expect(page.getByText("Adicionado ao carrinho!").first()).toBeVisible();

    await page.click("button:has-text('Espresso')");
    await page.click("text=ADICIONAR AO CARRINHO");
    await expect(page.getByText("Adicionado ao carrinho!").first()).toBeVisible();

    await page.goto("/carrinho", { waitUntil: "domcontentloaded" });
    const rows = page.locator(".item-row, [class*='rounded-lg'][class*='border']").filter({
      hasText: "Reserva do Agreste",
    });
    // Duas moagens diferentes do mesmo rótulo viram itens separados no carrinho.
    await expect(page.getByText("Em Grãos").first()).toBeVisible();
    await expect(page.getByText("Espresso").first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("5. Tentativa de compra de item esgotado", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Esgotado").first()).toBeVisible();

    await page.goto("/produtos/vale-do-sol", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("esgotada no momento").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "ADICIONAR AO CARRINHO" })).toBeDisabled();
  });
});
