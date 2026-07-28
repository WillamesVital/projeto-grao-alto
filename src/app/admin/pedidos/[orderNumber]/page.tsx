import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  formatBRL,
  formatDateLong,
  GRIND_LABELS,
  weightLabel,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_CLASSES,
} from "@/lib/format";
import AdminStatusForm from "@/components/admin-status-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } }, user: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile py-10 md:px-margin-desktop">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-label-md text-coffee-roast hover:text-honey-amber">
        <span className="material-symbols-outlined">arrow_back</span>
        Todos os pedidos
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-headline-lg text-coffee-roast">Pedido #{order.orderNumber}</h1>
          <p className="text-label-sm text-on-surface-variant">{formatDateLong(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-label-md font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mb-8 rounded-lg border border-outline-variant/10 bg-white p-6">
        <h3 className="mb-2 text-title-lg text-coffee-roast">Atualizar status</h3>
        <AdminStatusForm orderNumber={order.orderNumber} currentStatus={order.status} />
      </div>

      {order.status === "EM_CONFERENCIA" && (
        <div className="mb-8 rounded-lg border border-honey-amber/30 bg-honey-amber/10 p-6">
          <h3 className="mb-2 text-title-lg text-coffee-roast">Conferência manual necessária</h3>
          <p className="text-body-md text-on-surface-variant">
            Valor esperado: <strong>{formatBRL(order.totalCents)}</strong>
            {order.payments.some((p) => p.paidAmountCents != null) && (
              <>
                {" "}
                · Valor pago: <strong>{formatBRL(order.payments.find((p) => p.paidAmountCents != null)!.paidAmountCents!)}</strong>
              </>
            )}
          </p>
          {order.payments.find((p) => p.reviewNote)?.reviewNote && (
            <p className="mt-2 text-body-md text-on-surface-variant">
              {order.payments.find((p) => p.reviewNote)?.reviewNote}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="space-y-gutter md:col-span-8">
          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Itens</h3>
            <div className="divide-y divide-outline-variant/10">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-coffee-roast">{item.productNameSnapshot}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {weightLabel(item.weightGrams)} · {GRIND_LABELS[item.grind]} · {item.quantity}x · SKU
                    </p>
                  </div>
                  <p className="font-bold text-coffee-roast">{formatBRL(item.totalCents)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Cliente e entrega</h3>
            <p className="text-body-md text-on-surface-variant">{order.user.name} · {order.email}</p>
            <p className="text-body-md text-on-surface-variant">CPF: {order.cpf}</p>
            <p className="mt-2 text-body-md text-on-surface-variant">{order.shippingLabel}</p>
            {order.deliveryMethod === "DELIVERY" && (
              <p className="text-body-md text-on-surface-variant">
                {order.addressStreet}, {order.addressNumber} {order.addressComplement} —{" "}
                {order.addressNeighborhood}, {order.addressCity}/{order.addressState} (CEP {order.addressCep})
              </p>
            )}
          </div>

          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Tentativas de pagamento</h3>
            <div className="divide-y divide-outline-variant/10">
              {order.payments.map((p) => (
                <div key={p.id} className="py-3 text-body-md">
                  <div className="flex justify-between">
                    <span>{p.method === "PIX" ? "Pix" : `Cartão${p.cardLast4 ? ` •••• ${p.cardLast4}` : ""}`}</span>
                    <span className="font-bold">{p.status}</span>
                  </div>
                  {p.declineReason && <p className="text-label-sm text-error-red">{p.declineReason}</p>}
                  <p className="text-label-sm text-on-surface-variant">{formatDateLong(p.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-gutter md:col-span-4">
          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Totais</h3>
            <div className="space-y-2 text-body-md">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Desconto</span>
                <span>-{formatBRL(order.discountCents)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Frete</span>
                <span>{formatBRL(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 font-bold text-coffee-roast">
                <span>Total</span>
                <span>{formatBRL(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
