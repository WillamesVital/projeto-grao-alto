"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg bg-coffee-roast px-4 py-2 text-label-sm font-bold text-white hover:bg-honey-amber"
    >
      Imprimir / exportar
    </button>
  );
}
