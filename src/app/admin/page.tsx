import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL, formatDateLong, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASSES } from "@/lib/format";
import AdminAutoRefresh from "@/components/admin-auto-refresh";

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

  // RN-413.2/RN-413.8: pedidos em conferência exigem ação imediata e vêm
  // sempre no topo, com destaque visual — independente da ordem por data.
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === "EM_CONFERENCIA" && b.status !== "EM_CONFERENCIA") return -1;
    if (b.status === "EM_CONFERENCIA" && a.status !== "EM_CONFERENCIA") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const statusFilters = [
    { value: undefined, label: "Todos" },
    { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
    { value: "PAGO", label: "Pagamento confirmado" },
    { value: "EM_CONFERENCIA", label: "Em conferência" },
    { value: "EXPIRADO", label: "Pix expirado" },
    { value: "EM_PREPARO", label: "Em preparo" },
    { value: "PRONTO", label: "Pronto" },
    { value: "A_CAMINHO", label: "A caminho" },
    { value: "ENTREGUE", label: "Entregue" },
    { value: "CANCELADO", label: "Cancelado" },
  ];

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-10 md:px-margin-desktop">
      <AdminAutoRefresh />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-headline-lg text-coffee-roast">Pedidos</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/estoque"
            className="rounded-lg border border-outline-variant px-4 py-2 text-label-sm font-bold text-coffee-roast hover:border-coffee-roast"
          >
            Estoque por rótulo
          </Link>
          <Link
            href="/admin/separacao"
            className="rounded-lg border border-outline-variant px-4 py-2 text-label-sm font-bold text-coffee-roast hover:border-coffee-roast"
          >
            Lista de separação
          </Link>
        </div>
      </div>

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
              <th className="px-6 py-4">Itens (peso · moagem)</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sortedOrders.map((order) => (
              <tr
                key={order.id}
                className={`hover:bg-surface-container-low ${
                  order.status === "EM_CONFERENCIA" ? "bg-honey-amber/10" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <Link href={`/admin/pedidos/${order.orderNumber}`} className="font-bold text-coffee-roast hover:text-honey-amber">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{order.email}</td>
                <td className="px-6 py-4 text-on-surface-variant">{formatDateLong(order.createdAt)}</td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.quantity}x {item.productNameSnapshot} —{" "}
                      <strong className="text-coffee-roast">
                        {item.weightGrams >= 1000 ? `${item.weightGrams / 1000}kg` : `${item.weightGrams}g`} ·{" "}
                        {item.grind}
                      </strong>
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 font-bold text-coffee-roast">{formatBRL(order.totalCents)}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-label-sm font-bold ${ORDER_STATUS_BADGE_CLASSES[order.status]}`}>
                    {order.status === "EM_CONFERENCIA" ? "⚠ " : ""}
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
