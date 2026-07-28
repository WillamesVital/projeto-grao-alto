import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GRIND_LABELS, weightLabel } from "@/lib/format";
import PrintButton from "@/components/print-button";

const ZONE_LABELS: Record<string, string> = {
  A: "Faixa A",
  B: "Faixa B",
  C: "Faixa C",
  FORA_DA_AREA: "Correios / fora da área",
};

/** RN-413.5/RN-413.9: lista de separação do dia, agrupada por rota, imprimível. */
export default async function AdminPickListPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAGO", "EM_PREPARO"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const pickupOrders = orders.filter((o) => o.deliveryMethod === "PICKUP");
  const deliveryByZone = new Map<string, typeof orders>();
  for (const order of orders) {
    if (order.deliveryMethod !== "DELIVERY") continue;
    const key = order.shippingZoneCode ?? "FORA_DA_AREA";
    deliveryByZone.set(key, [...(deliveryByZone.get(key) ?? []), order]);
  }

  const groups: { label: string; orders: typeof orders }[] = [
    ...(["A", "B", "C", "FORA_DA_AREA"] as const)
      .filter((z) => deliveryByZone.has(z))
      .map((z) => ({ label: ZONE_LABELS[z], orders: deliveryByZone.get(z)! })),
    ...(pickupOrders.length > 0 ? [{ label: "Retirada na loja", orders: pickupOrders }] : []),
  ];

  return (
    <div className="mx-auto max-w-(--container-max) px-margin-mobile py-10 md:px-margin-desktop print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin" className="inline-flex items-center gap-2 text-label-md text-coffee-roast hover:text-honey-amber">
          <span className="material-symbols-outlined">arrow_back</span>
          Pedidos
        </Link>
        <PrintButton />
      </div>

      <h1 className="font-display mb-8 text-headline-lg text-coffee-roast">Lista de separação do dia</h1>

      {groups.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Nenhum pedido pago aguardando preparo.</p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-4 border-b border-outline-variant/30 pb-2 text-title-lg text-coffee-roast">
                {group.label} · {group.orders.length} pedido(s)
              </h2>
              <div className="space-y-4">
                {group.orders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-outline-variant/20 p-4">
                    <p className="mb-2 font-bold text-coffee-roast">
                      #{order.orderNumber} — {order.email}
                    </p>
                    <ul className="space-y-1 text-body-md">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}x {item.productNameSnapshot} —{" "}
                          <strong className="text-coffee-roast">
                            {weightLabel(item.weightGrams)} · {GRIND_LABELS[item.grind]}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
