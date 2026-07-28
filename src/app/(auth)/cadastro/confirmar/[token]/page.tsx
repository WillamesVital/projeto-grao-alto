import Link from "next/link";
import { consumeEmailVerification } from "@/lib/account-tokens";
import AuthShell from "@/components/auth-shell";

const REASON_MESSAGES: Record<string, string> = {
  not_found: "Link de confirmação inválido.",
  used: "Este link já foi usado.",
  expired: "Este link expirou. Você já pode fazer login e solicitar um novo e-mail de confirmação.",
};

export default async function ConfirmEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await consumeEmailVerification(token);

  return (
    <AuthShell
      brandTitle="Quase lá."
      brandBody="Confirme seu e-mail para começar a explorar nossos cafés especiais."
    >
      <div className="text-center">
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            result.ok ? "bg-tertiary-fixed text-plantation-green" : "bg-error-container text-error-red"
          }`}
        >
          <span className="material-symbols-outlined text-4xl">
            {result.ok ? "check_circle" : "error"}
          </span>
        </div>
        <h2 className="font-display mb-4 text-headline-md text-coffee-roast">
          {result.ok ? "E-mail confirmado!" : "Não foi possível confirmar"}
        </h2>
        <p className="mb-8 leading-relaxed text-on-surface-variant">
          {result.ok
            ? "Sua conta está pronta. Faça login para começar a comprar."
            : REASON_MESSAGES[result.reason]}
        </p>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-coffee-roast py-4 text-center font-bold text-white transition-all hover:bg-honey-amber"
        >
          Ir para o login
        </Link>
      </div>
    </AuthShell>
  );
}
