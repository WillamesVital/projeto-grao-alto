import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatBRL, GRIND_LABELS, weightLabel } from "@/lib/format";

export default async function OrderConfirmedPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order || order.userId !== user.id) notFound();
  if (order.status === "AGUARDANDO_PAGAMENTO") redirect(`/checkout/pix/${order.orderNumber}`);

  const deliveryLabel =
    order.deliveryMethod === "PICKUP"
      ? "Retirada na loja: pronto em 4h úteis, guardado por 5 dias."
      : `${order.shippingLabel} — ${order.addressStreet}, ${order.addressNumber} · ${order.addressNeighborhood}`;

  return (
    <div className="mx-auto max-w-4xl px-margin-mobile py-16 md:px-margin-desktop">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-plantation-green text-on-primary shadow-sm">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h1 className="font-display mb-2 text-headline-lg text-coffee-roast">Pedido Confirmado!</h1>
        <p className="text-body-lg text-on-surface-variant">
          O aroma do seu café especial já está quase no ar.
        </p>
        <div className="mt-8 inline-block rounded-xl border border-outline-variant/30 bg-surface-container px-6 py-3">
          <span className="text-label-md tracking-wider text-on-surface-variant uppercase">
            Número do Pedido
          </span>
          <p className="text-title-lg font-bold text-coffee-roast">#{order.orderNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
        <div className="space-y-gutter md:col-span-8">
          <div className="rounded-xl border border-outline-variant/10 bg-white p-8 shadow-[0_12px_40px_-12px_rgba(39,19,16,0.04)]">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-secondary-fixed p-3 text-on-secondary-fixed-variant">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <div>
                <h3 className="text-title-lg text-coffee-roast">Entrega</h3>
                <p className="text-body-md text-on-surface-variant">{deliveryLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-white p-8 shadow-[0_12px_40px_-12px_rgba(39,19,16,0.04)]">
            <h3 className="mb-6 text-title-lg text-coffee-roast">Resumo dos Itens</h3>
            <div className="divide-y divide-outline-variant/10">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <div className="flex-grow">
                    <p className="text-base text-title-lg text-coffee-roast">{item.productNameSnapshot}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {weightLabel(item.weightGrams)} · {GRIND_LABELS[item.grind]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-label-md text-on-surface-variant">{item.quantity}x</p>
                    <p className="text-base text-title-lg text-coffee-roast">{formatBRL(item.totalCents)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2 border-t border-outline-variant/20 pt-6">
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotalCents)}</span>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-body-md text-plantation-green">
                  <span>Desconto</span>
                  <span>-{formatBRL(order.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Frete</span>
                <span className={order.shippingCents === 0 ? "font-medium text-plantation-green" : ""}>
                  {order.shippingCents === 0 ? "Grátis" : formatBRL(order.shippingCents)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-title-lg text-coffee-roast">
                <span>Total Pago</span>
                <span>{formatBRL(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-gutter md:col-span-4">
          <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-center text-on-primary">
            <span className="material-symbols-outlined mb-4 text-4xl">forward_to_inbox</span>
            <h4 className="mb-2 text-title-lg">Confira seu e-mail</h4>
            <p className="text-body-md opacity-80">
              Enviamos a confirmação com o resumo do pedido para: <strong>{order.email}</strong>
            </p>
          </div>
          <div className="rounded-xl border border-honey-amber/20 bg-honey-amber/10 p-8 text-center">
            <p className="mb-6 text-body-md text-on-secondary-container italic">
              &quot;O café perfeito leva tempo, mas a espera vale cada gota.&quot;
            </p>
            <Link
              href="/pedidos"
              className="block w-full rounded-lg bg-coffee-roast px-6 py-4 text-center text-label-md font-bold tracking-widest text-paper-offwhite uppercase transition-all hover:bg-honey-amber"
            >
              Ver Meus Pedidos
            </Link>
            <Link href="/" className="mt-4 block w-full py-3 text-label-md text-coffee-roast hover:underline">
              Voltar para a Loja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
