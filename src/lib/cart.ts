import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const GUEST_CART_COOKIE = "ga_cart_token";
const GUEST_CART_DAYS = 7;
const USER_CART_DAYS = 30;
const CHECKOUT_PRICE_FREEZE_MINUTES = 30;
const MAX_QTY_PER_ITEM = 10;

const CART_INCLUDE = {
  items: {
    include: {
      product: true,
      productVariant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

type PersistedCart = NonNullable<Awaited<ReturnType<typeof findExistingCart>>>;

const EMPTY_CART = {
  id: "",
  userId: null,
  guestToken: null,
  expiresAt: new Date(0),
  checkoutLockedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  items: [] as PersistedCart["items"],
};

export type CartWithItems = PersistedCart | typeof EMPTY_CART;

async function findExistingCart() {
  const user = await getCurrentUser();
  if (user) {
    return prisma.cart.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      include: CART_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return null;

  return prisma.cart.findFirst({
    where: { guestToken, expiresAt: { gt: new Date() } },
    include: CART_INCLUDE,
  });
}

/**
 * Leitura do carrinho para uso em Server Components (layout, página do
 * carrinho, checkout). Nunca grava cookie — o Next.js só permite alterar
 * cookies dentro de Server Actions/Route Handlers. Se o visitante ainda não
 * tem um carrinho de convidado, devolve um carrinho vazio "fantasma" (não
 * persistido) em vez de criar um agora.
 */
export async function getCart(): Promise<CartWithItems> {
  const existing = await findExistingCart();
  if (existing) return syncCartPrices(existing);

  const user = await getCurrentUser();
  if (user) {
    const cart = await prisma.cart.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + USER_CART_DAYS * 86400000) },
      include: CART_INCLUDE,
    });
    return cart;
  }

  return EMPTY_CART;
}

/**
 * Igual a `getCart`, mas pode criar o carrinho de convidado e gravar o
 * cookie — só pode ser chamada de dentro de uma Server Action.
 */
export async function getOrCreateCartForMutation(): Promise<PersistedCart> {
  const existing = await findExistingCart();
  if (existing) return syncCartPrices(existing);

  const user = await getCurrentUser();
  if (user) {
    return prisma.cart.create({
      data: { userId: user.id, expiresAt: new Date(Date.now() + USER_CART_DAYS * 86400000) },
      include: CART_INCLUDE,
    });
  }

  const guestToken = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(GUEST_CART_COOKIE, guestToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_CART_DAYS * 86400,
  });

  return prisma.cart.create({
    data: { guestToken, expiresAt: new Date(Date.now() + GUEST_CART_DAYS * 86400000) },
    include: CART_INCLUDE,
  });
}

/** Mantém o preço "ao vivo" sincronizado com o catálogo, exceto durante o
 * congelamento de 30 minutos iniciado no checkout (regra do Fluxo 4/5). */
async function syncCartPrices<T extends PersistedCart>(cart: T): Promise<T> {
  const priceIsFrozen =
    !!cart.checkoutLockedAt &&
    Date.now() - cart.checkoutLockedAt.getTime() < CHECKOUT_PRICE_FREEZE_MINUTES * 60 * 1000;

  for (const item of cart.items) {
    const outOfStock = item.productVariant.stockQty <= 0;
    const priceChanged = !priceIsFrozen && item.unitPriceCents !== item.productVariant.priceCents;

    if (outOfStock !== item.outOfStockFlag || priceChanged) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: {
          outOfStockFlag: outOfStock,
          unitPriceCents: priceIsFrozen ? item.unitPriceCents : item.productVariant.priceCents,
        },
      });
      item.outOfStockFlag = outOfStock;
      if (!priceIsFrozen) item.unitPriceCents = item.productVariant.priceCents;
    }
  }

  return cart;
}

export type QuantityCapReason = "STOCK" | "MAX_PER_ITEM" | null;
export type QuantityChangeResult = { quantity: number; cappedReason: QuantityCapReason };

function capReasonFor(requested: number, applied: number, stockQty: number): QuantityCapReason {
  if (requested <= applied) return null;
  return stockQty < MAX_QTY_PER_ITEM ? "STOCK" : "MAX_PER_ITEM";
}

/** RN-301/RN-302.6: quantidade nunca passa de 10 por item nem do estoque
 * disponível — o que for menor. */
export async function addItemToCart(
  productVariantId: string,
  quantity: number,
): Promise<QuantityChangeResult> {
  const cart = await getOrCreateCartForMutation();
  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: { id: productVariantId },
  });

  const existing = cart.items.find((i) => i.productVariantId === productVariantId);
  const cap = Math.min(MAX_QTY_PER_ITEM, variant.stockQty);
  if (cap <= 0) {
    return { quantity: existing?.quantity ?? 0, cappedReason: "STOCK" };
  }

  const requestedTotal = (existing?.quantity ?? 0) + quantity;
  const desiredQty = Math.min(cap, requestedTotal);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: desiredQty, unitPriceCents: variant.priceCents },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: variant.productId,
        productVariantId: variant.id,
        quantity: desiredQty,
        unitPriceCents: variant.priceCents,
      },
    });
  }

  return { quantity: desiredQty, cappedReason: capReasonFor(requestedTotal, desiredQty, variant.stockQty) };
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<QuantityChangeResult> {
  const item = await prisma.cartItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { productVariant: true },
  });
  const cap = Math.min(MAX_QTY_PER_ITEM, item.productVariant.stockQty);
  const clamped = Math.max(1, Math.min(Math.max(cap, 1), quantity));
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: clamped } });
  return { quantity: clamped, cappedReason: capReasonFor(quantity, clamped, item.productVariant.stockQty) };
}

export async function removeCartItem(itemId: string) {
  await prisma.cartItem.delete({ where: { id: itemId } });
}

export function cartTotals(cart: { items: Array<{ quantity: number; unitPriceCents: number }> }) {
  return cart.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}

export function cartWeightGrams(
  cart: { items: Array<{ quantity: number; productVariant: { weightGrams: number } }> },
) {
  return cart.items.reduce((sum, item) => sum + item.quantity * item.productVariant.weightGrams, 0);
}

/** Funde o carrinho de visitante ao carrinho da conta no login (Fluxo 2). */
export async function mergeGuestCartIntoUser(userId: string) {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return;

  const guestCart = await prisma.cart.findFirst({
    where: { guestToken, expiresAt: { gt: new Date() } },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) {
    cookieStore.delete(GUEST_CART_COOKIE);
    return;
  }

  let userCart = await prisma.cart.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    include: { items: true },
  });
  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId, expiresAt: new Date(Date.now() + USER_CART_DAYS * 86400000) },
      include: { items: true },
    });
  }

  for (const guestItem of guestCart.items) {
    const variant = await prisma.productVariant.findUnique({ where: { id: guestItem.productVariantId } });
    const cap = Math.min(MAX_QTY_PER_ITEM, variant?.stockQty ?? 0);
    if (cap <= 0) continue;

    const existing = userCart.items.find((i) => i.productVariantId === guestItem.productVariantId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(cap, existing.quantity + guestItem.quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: guestItem.productId,
          productVariantId: guestItem.productVariantId,
          quantity: Math.min(cap, guestItem.quantity),
          unitPriceCents: guestItem.unitPriceCents,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  cookieStore.delete(GUEST_CART_COOKIE);
}

export async function lockCartForCheckout(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { checkoutLockedAt: new Date() } });
}

/**
 * Garante uma chave de idempotência estável para o carrinho, gerada uma
 * única vez e reaproveitada em todo reload da página de checkout (RN-410.1)
 * — ao contrário de uma chave gerada a cada render, que perderia a proteção
 * contra double-submit assim que a página fosse recarregada. É limpa quando
 * o pedido é efetivamente criado (`placeOrderAction`), para que o próximo
 * checkout no mesmo carrinho gere uma chave nova.
 */
export async function ensureCheckoutIdempotencyKey(cartId: string): Promise<string> {
  const cart = await prisma.cart.findUniqueOrThrow({ where: { id: cartId } });
  if (cart.checkoutIdempotencyKey) return cart.checkoutIdempotencyKey;
  const key = randomUUID();
  await prisma.cart.update({ where: { id: cartId }, data: { checkoutIdempotencyKey: key } });
  return key;
}

export async function clearCheckoutIdempotencyKey(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { checkoutIdempotencyKey: null } });
}
