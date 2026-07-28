import { headers } from "next/headers";

/** IP do cliente a partir dos cabeçalhos de proxy — usado para registrar o
 * aceite de termos (RN-101.7/LGPD) e, no futuro, bloqueio de login por IP. */
export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return h.get("x-real-ip");
}
