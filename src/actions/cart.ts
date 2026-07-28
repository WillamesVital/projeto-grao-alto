"use server";

import { revalidatePath } from "next/cache";
import { addItemToCart, updateCartItemQuantity, removeCartItem } from "@/lib/cart";

export async function addToCartAction(productVariantId: string, quantity: number) {
  const result = await addItemToCart(productVariantId, quantity);
  revalidatePath("/", "layout");
  return result;
}

export async function updateQuantityAction(itemId: string, quantity: number) {
  const result = await updateCartItemQuantity(itemId, quantity);
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
  return result;
}

export async function removeItemAction(itemId: string) {
  await removeCartItem(itemId);
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
}
