"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/actions/admin";
import { ORDER_STATUS_LABELS } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";

const OPTIONS: OrderStatus[] = [
  "AGUARDANDO_PAGAMENTO",
  "PAGO",
  "EM_CONFERENCIA",
  "EXPIRADO",
  "EM_PREPARO",
  "PRONTO",
  "A_CAMINHO",
  "ENTREGUE",
  "CANCELADO",
];

export default function AdminStatusForm({
  orderNumber,
  currentStatus,
}: {
  orderNumber: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateOrderStatusAction(orderNumber, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-body-md"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {ORDER_STATUS_LABELS[opt]}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-coffee-roast px-4 py-2 font-bold text-white hover:bg-honey-amber disabled:opacity-60"
      >
        {isPending ? "Salvando..." : saved ? "Salvo!" : "Atualizar status"}
      </button>
    </div>
  );
}
