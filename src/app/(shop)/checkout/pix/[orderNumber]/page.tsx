import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatBRL } from "@/lib/format";
import PixPaymentPanel from "@/components/pix-payment-panel";

export default async function PixWaitingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || order.userId !== user.id) notFound();

  if (order.status !== "AGUARDANDO_PAGAMENTO") {
    redirect(`/pedido-confirmado/${order.orderNumber}`);
  }

  const payment = order.payments.find((p) => p.method === "PIX" && p.status === "PENDING");
  if (!payment || !payment.pixCode || !payment.gatewayTransactionId) notFound();

  const qrDataUrl = await QRCode.toDataURL(payment.pixCode, { margin: 1, width: 320 });
  // eslint-disable-next-line react-hooks/purity -- Server Component: avaliado uma vez por request no servidor, não durante um render de cliente.
  const now = Date.now();
  const expired = !!payment.pixExpiresAt && payment.pixExpiresAt.getTime() < now;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display mb-2 text-headline-lg text-coffee-roast">Pague com Pix</h1>
      <p className="mb-8 text-body-md text-on-surface-variant">
        Pedido {order.orderNumber} — {formatBRL(order.totalCents)}
      </p>

      {expired ? (
        <p className="rounded-lg bg-error-container px-4 py-3 text-label-md text-on-error-container">
          Este código Pix expirou. Volte ao carrinho e finalize a compra novamente.
        </p>
      ) : (
        <>
          <div className="mx-auto mb-6 w-fit rounded-xl bg-surface-container p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code Pix" width={240} height={240} className="rounded bg-white" />
          </div>
          <p className="mb-6 text-body-md text-on-surface-variant">
            Escaneie o código no app do seu banco ou copie a chave abaixo. Expira em 30 minutos.
          </p>
          <PixPaymentPanel
            orderNumber={order.orderNumber}
            gatewayTransactionId={payment.gatewayTransactionId}
            pixCode={payment.pixCode}
          />
        </>
      )}
    </div>
  );
}
