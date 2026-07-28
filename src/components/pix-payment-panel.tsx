"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PixPaymentPanel({
  orderNumber,
  gatewayTransactionId,
  pixCode,
}: {
  orderNumber: string;
  gatewayTransactionId: string;
  pixCode: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSimulatePayment() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/webhooks/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayTransactionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Não foi possível confirmar o pagamento.");
        return;
      }
      router.push(`/pedido-confirmado/${orderNumber}`);
    } catch {
      setStatus("error");
      setError("Falha de conexão. Tente novamente.");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-coffee-roast transition-all hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined">content_copy</span>
        {copied ? "Copiado!" : "Copiar Código Pix"}
      </button>

      {error && (
        <p className="rounded-lg bg-error-container px-4 py-3 text-label-md text-on-error-container">
          {error}
        </p>
      )}

      <button
        onClick={handleSimulatePayment}
        disabled={status === "loading"}
        className="w-full max-w-xs rounded-lg bg-plantation-green py-4 font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {status === "loading" ? "Confirmando..." : "Já paguei (simular webhook)"}
      </button>
      <p className="max-w-xs text-center text-label-sm text-on-surface-variant italic">
        Este botão simula a chamada de webhook que um gateway real enviaria ao confirmar o Pix.
      </p>
    </div>
  );
}
