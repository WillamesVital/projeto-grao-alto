"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido.");

export type RestockRequestResult = { ok: boolean; message: string };

/** GA-206/RN-206.3-4: captura só o e-mail para avisar quando o produto voltar ao estoque. */
export async function requestRestockNotificationAction(
  productId: string,
  email: string,
): Promise<RestockRequestResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: "Informe um e-mail válido." };
  }

  await prisma.restockRequest.upsert({
    where: { productId_email: { productId, email: parsed.data } },
    update: {},
    create: { productId, email: parsed.data },
  });

  return { ok: true, message: "Pronto! Avisamos você por e-mail assim que este café voltar." };
}
