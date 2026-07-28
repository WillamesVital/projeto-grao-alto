import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmOrderPayment } from "@/lib/orders";

/**
 * Endpoint de webhook do Pix. Num gateway de verdade, esta rota seria
 * chamada pelo provedor quando o pagamento é reconhecido. Aqui, quem chama é
 * o botão "Já paguei" da tela de espera (simulação para o curso) — mas o
 * contrato (idempotente, seguro contra duplicidade e atraso) é o mesmo que
 * usaríamos com um provedor real.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const gatewayTransactionId = body?.gatewayTransactionId as string | undefined;
  if (!gatewayTransactionId) {
    return NextResponse.json({ ok: false, error: "gatewayTransactionId ausente." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { gatewayTransactionId } });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Pagamento não encontrado." }, { status: 404 });
  }

  if (payment.method === "PIX" && payment.pixExpiresAt && payment.pixExpiresAt.getTime() < Date.now()) {
    if (payment.status === "PENDING") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
    }
    return NextResponse.json({ ok: false, error: "Pix expirado." }, { status: 410 });
  }

  // Idempotente: se já foi processado (webhook duplicado ou atrasado), apenas
  // confirma o estado atual sem debitar estoque de novo.
  const result = await confirmOrderPayment(payment.orderId, payment.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true, orderNumber: result.order.orderNumber });
}
