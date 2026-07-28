"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatBRL, GRIND_LABELS, weightLabel } from "@/lib/format";
import { updateQuantityAction, removeItemAction } from "@/actions/cart";

type Props = {
  id: string;
  name: string;
  imageUrl: string;
  sensoryNotes: string;
  weightGrams: number;
  grind: string;
  quantity: number;
  unitPriceCents: number;
  outOfStockFlag: boolean;
};

export default function CartItemRow(props: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function changeQty(delta: number) {
    const next = props.quantity + delta;
    if (next < 1 || next > 10) return;
    startTransition(async () => {
      await updateQuantityAction(props.id, next);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeItemAction(props.id);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex flex-col gap-6 rounded-lg border bg-white p-4 shadow-[0_12px_24px_-10px_rgba(39,19,16,0.04)] transition-soft md:flex-row md:p-6 ${
        props.outOfStockFlag ? "border-error-red/40" : "border-outline-variant/10"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="h-32 w-full flex-shrink-0 overflow-hidden rounded bg-surface-container md:w-32">
        <Image src={props.imageUrl} alt={props.name} width={128} height={128} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-grow flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display mb-1 text-headline-md text-coffee-roast">{props.name}</h3>
            <p className="text-label-md font-medium text-honey-amber">Notas: {props.sensoryNotes}</p>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {weightLabel(props.weightGrams)} · Moagem: <span className="font-semibold text-on-surface">{GRIND_LABELS[props.grind]}</span>
            </p>
            {props.outOfStockFlag && (
              <p className="mt-2 flex items-center gap-1 text-label-sm font-bold text-error-red">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Este item esgotou. Remova-o para continuar a compra.
              </p>
            )}
          </div>
          <button onClick={remove} className="text-outline transition-colors hover:text-error" aria-label="Remover item">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="flex h-10 items-center rounded-full border border-outline-variant p-1">
            <button
              onClick={() => changeQty(-1)}
              disabled={isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full text-coffee-roast transition-colors hover:bg-surface-container-low"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-coffee-roast">{props.quantity}</span>
            <button
              onClick={() => changeQty(1)}
              disabled={isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full text-coffee-roast transition-colors hover:bg-surface-container-low"
            >
              +
            </button>
          </div>
          <p className="font-display text-headline-md text-coffee-roast">
            {formatBRL(props.unitPriceCents * props.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}
