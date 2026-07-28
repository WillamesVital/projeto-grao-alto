import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  formatBRL,
  formatDateLong,
  GRIND_LABELS,
  weightLabel,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_CLASSES,
  ORDER_STATUS_FLOW,
} from "@/lib/format";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || order.userId !== user.id) notFound();

  const currentStepIndex = ORDER_STATUS_FLOW.indexOf(
    order.status as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile py-12 md:px-margin-desktop">
      <Link href="/pedidos" className="mb-6 inline-flex items-center gap-2 text-label-md text-coffee-roast hover:text-honey-amber">
        <span className="material-symbols-outlined">arrow_back</span>
        Meus Pedidos
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-headline-lg text-coffee-roast">Pedido #{order.orderNumber}</h1>
        <span className={`rounded-full px-4 py-2 text-label-md font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {order.status !== "CANCELADO" && (
        <ol className="mb-10 flex flex-wrap gap-4">
          {ORDER_STATUS_FLOW.map((step, i) => (
            <li
              key={step}
              className={`rounded-full px-4 py-2 text-label-sm font-bold ${
                i <= currentStepIndex ? "bg-coffee-roast text-white" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {ORDER_STATUS_LABELS[step]}
            </li>
          ))}
        </ol>
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
                      {weightLabel(item.weightGrams)} · {GRIND_LABELS[item.grind]} · {item.quantity}x
                    </p>
                  </div>
                  <p className="font-bold text-coffee-roast">{formatBRL(item.totalCents)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Entrega</h3>
            <p className="text-body-md text-on-surface-variant">{order.shippingLabel}</p>
            {order.deliveryMethod === "DELIVERY" && (
              <p className="mt-1 text-body-md text-on-surface-variant">
                {order.addressStreet}, {order.addressNumber} {order.addressComplement} —{" "}
                {order.addressNeighborhood}, {order.addressCity}/{order.addressState}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-gutter md:col-span-4">
          <div className="rounded-lg border border-outline-variant/10 bg-white p-6">
            <h3 className="mb-4 text-title-lg text-coffee-roast">Pagamento</h3>
            <p className="text-body-md text-on-surface-variant">
              {order.paymentMethod === "PIX" ? "Pix" : "Cartão de crédito"}
            </p>
            <div className="mt-4 space-y-2 border-t border-outline-variant/20 pt-4 text-body-md">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Frete</span>
                <span>{formatBRL(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between font-bold text-coffee-roast">
                <span>Total</span>
                <span>{formatBRL(order.totalCents)}</span>
              </div>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Pedido feito em {formatDateLong(order.createdAt)}
          </p>
        </aside>
      </div>
    </div>
  );
}
