import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmOrderPayment } from "@/lib/orders";

/**
 * Endpoint de webhook do Pix. Num gateway de verdade, esta rota seria
 * chamada pelo provedor quando o pagamento é reconhecido. Aqui, quem chama é
 * o botão "Já paguei" da tela de espera (simulação para o curso) — mas o
 * contrato (idempotente, seguro contra duplicidade e atraso) é o mesmo que
 * usaríamos com um provedor real.
 *
 * RN-407.7: um webhook chegando DEPOIS da expiração do Pix, com pagamento
 * efetivamente realizado, nunca é rejeitado — "dinheiro recebido nunca é
 * ignorado". `confirmOrderPayment` reativa o pedido como pago mesmo que ele
 * já tenha sido marcado `EXPIRADO`.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const gatewayTransactionId = body?.gatewayTransactionId as string | undefined;
  const paidAmountCents = typeof body?.paidAmountCents === "number" ? body.paidAmountCents : undefined;
  if (!gatewayTransactionId) {
    return NextResponse.json({ ok: false, error: "gatewayTransactionId ausente." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { gatewayTransactionId } });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "Pagamento não encontrado." }, { status: 404 });
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id: payment.orderId } });

  // RN-407.8: valor pago divergente do valor do pedido não confirma
  // automaticamente — vai para conferência manual da Bia.
  if (paidAmountCents != null && paidAmountCents !== order.totalCents) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paidAmountCents,
        reviewNote: `Valor pago (${paidAmountCents / 100}) diverge do valor do pedido (${order.totalCents / 100}).`,
      },
    });
    await prisma.order.update({ where: { id: order.id }, data: { status: "EM_CONFERENCIA" } });
    return NextResponse.json({ ok: false, error: "Valor divergente. Pedido em conferência.", orderNumber: order.orderNumber }, { status: 409 });
  }

  // Idempotente: se já foi processado (webhook duplicado ou atrasado), apenas
  // confirma o estado atual sem debitar estoque de novo.
  const result = await confirmOrderPayment(payment.orderId, payment.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true, orderNumber: result.order.orderNumber });
}
