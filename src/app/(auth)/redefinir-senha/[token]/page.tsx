"use client";

import { useActionState } from "react";
import { use } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import { resetPasswordAction, type FormState } from "@/actions/auth";

const initialState: FormState = { ok: false };

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const boundAction = resetPasswordAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <AuthShell
      brandTitle="Uma senha nova, o mesmo ritual."
      brandBody="Escolha uma senha forte para manter sua conta segura."
    >
      {state.ok ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-fixed text-plantation-green">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="font-display mb-4 text-headline-md text-coffee-roast">Senha redefinida</h2>
          <p className="mb-8 leading-relaxed text-on-surface-variant">{state.message}</p>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-coffee-roast py-4 text-center font-bold text-white transition-all hover:bg-honey-amber"
          >
            Ir para o login
          </Link>
        </div>
      ) : (
        <>
          <header className="mb-10">
            <h1 className="font-display mb-2 text-headline-md text-coffee-roast">Nova senha</h1>
            <p className="text-on-surface-variant">Este link só pode ser usado uma vez.</p>
          </header>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-label-md text-coffee-roast" htmlFor="password">
                Nova senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Mín. 8 caracteres"
                className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label-md text-coffee-roast" htmlFor="confirmPassword">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
              />
            </div>
            {state.message && !state.ok && (
              <p className="text-label-md text-error-red">{state.message}</p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coffee-roast px-6 py-4 text-title-lg text-paper-offwhite transition-colors duration-300 hover:bg-honey-amber active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
