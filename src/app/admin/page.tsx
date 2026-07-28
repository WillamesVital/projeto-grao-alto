import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateLong, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASSES } from "@/lib/format";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 100,
  });

  const statusFilters = [
    { value: undefined, label: "Todos" },
    { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
    { value: "EM_PREPARO", label: "Em preparo" },
    { value: "PRONTO", label: "Pronto" },
    { value: "A_CAMINHO", label: "A caminho" },
    { value: "ENTREGUE", label: "Entregue" },
    { value: "CANCELADO", label: "Cancelado" },
  ];

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-10 md:px-margin-desktop">
      <h1 className="font-display mb-8 text-headline-lg text-coffee-roast">Pedidos</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin?status=${f.value}` : "/admin"}
            className={`rounded-full border px-4 py-2 text-label-sm font-bold transition-colors ${
              status === f.value
                ? "border-coffee-roast bg-coffee-roast text-white"
                : "border-outline-variant text-on-surface-variant hover:border-coffee-roast"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant/10 bg-white">
        <table className="w-full text-left text-body-md">
          <thead className="bg-surface-container-high text-label-sm tracking-wider text-on-surface-variant uppercase">
            <tr>
              <th className="px-6 py-4">Pedido</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Itens</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-container-low">
                <td className="px-6 py-4">
                  <Link href={`/admin/pedidos/${order.orderNumber}`} className="font-bold text-coffee-roast hover:text-honey-amber">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{order.email}</td>
                <td className="px-6 py-4 text-on-surface-variant">{formatDateLong(order.createdAt)}</td>
                <td className="px-6 py-4 text-on-surface-variant">{order.items.length}</td>
                <td className="px-6 py-4 font-bold text-coffee-roast">{formatBRL(order.totalCents)}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-label-sm font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="p-8 text-center text-on-surface-variant">Nenhum pedido encontrado.</p>
        )}
      </div>
    </div>
  );
}
