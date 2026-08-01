"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PixPaymentPanel({
  orderNumber,
  gatewayTransactionId,
  pixCode,
  pixExpiresAt,
}: {
  orderNumber: string;
  gatewayTransactionId: string;
  pixCode: string;
  pixExpiresAt: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [msRemaining, setMsRemaining] = useState(
    () => new Date(pixExpiresAt).getTime() - Date.now(),
  );
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setMsRemaining(new Date(pixExpiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [pixExpiresAt]);

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
      <div className="w-full max-w-xs text-left">
        <label className="mb-2 block text-label-sm tracking-wider text-on-surface-variant uppercase">
          Código Copia e Cola
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
          <span className="flex-1 truncate text-label-sm text-on-surface-variant">{pixCode}</span>
          <button
            onClick={handleCopy}
            aria-label="Copiar código Pix"
            className="flex shrink-0 items-center gap-1 text-coffee-roast transition-colors hover:text-honey-amber"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
        </div>
        {copied && <p className="mt-1 text-label-sm text-plantation-green">Copiado!</p>}
      </div>

      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">schedule</span>
        <span className="text-label-md">
          Expira em <span className="font-bold text-coffee-roast">{formatCountdown(msRemaining)}</span> minutos
        </span>
      </div>
      <p className="-mt-4 text-label-sm text-on-surface-variant italic">
        O processamento costuma levar menos de 1 minuto após o pagamento.
      </p>

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
