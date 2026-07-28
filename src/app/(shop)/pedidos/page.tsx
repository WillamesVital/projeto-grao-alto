import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatBRL, formatDateLong, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASSES } from "@/lib/format";

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: { not: "CANCELADO" } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile py-12 md:px-margin-desktop">
      <h1 className="font-display mb-8 text-headline-lg text-coffee-roast">Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-16 text-center">
          <p className="mb-4 text-title-lg text-coffee-roast">Você ainda não fez nenhum pedido.</p>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-coffee-roast px-6 py-3 font-bold text-white hover:bg-honey-amber">
            Explorar cafés
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/10 rounded-lg border border-outline-variant/10 bg-white">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/pedidos/${order.orderNumber}`}
                className="flex flex-col gap-2 p-6 transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-title-lg text-coffee-roast">#{order.orderNumber}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {formatDateLong(order.createdAt)} · {order.items.length} item(ns)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-label-sm font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-bold text-coffee-roast">{formatBRL(order.totalCents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
