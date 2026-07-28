"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  return user;
}

export async function updateOrderStatusAction(orderNumber: string, status: OrderStatus) {
  await requireAdmin();
  await prisma.order.update({ where: { orderNumber }, data: { status } });
  revalidatePath(`/admin/pedidos/${orderNumber}`);
  revalidatePath("/admin");
}
