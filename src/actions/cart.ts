"use server";

import { revalidatePath } from "next/cache";
import { addItemToCart, updateCartItemQuantity, removeCartItem } from "@/lib/cart";

export async function addToCartAction(productVariantId: string, quantity: number) {
  await addItemToCart(productVariantId, quantity);
  revalidatePath("/", "layout");
}

export async function updateQuantityAction(itemId: string, quantity: number) {
  await updateCartItemQuantity(itemId, quantity);
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
}

export async function removeItemAction(itemId: string) {
  await removeCartItem(itemId);
  revalidatePath("/carrinho");
  revalidatePath("/", "layout");
}
