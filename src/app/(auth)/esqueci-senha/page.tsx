"use client";

import { useActionState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import { forgotPasswordAction, type FormState } from "@/actions/auth";

const initialState: FormState = { ok: false };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  return (
    <AuthShell
      brandTitle="Vamos recuperar seu acesso."
      brandBody="Em poucos minutos você volta a escolher seus grãos favoritos."
    >
      {state.ok ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-fixed text-plantation-green">
            <span className="material-symbols-outlined text-4xl">mail</span>
          </div>
          <h2 className="font-display mb-4 text-headline-md text-coffee-roast">Verifique seu e-mail</h2>
          <p className="mb-8 leading-relaxed text-on-surface-variant">{state.message}</p>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-coffee-roast py-4 text-center font-bold text-white transition-all hover:bg-honey-amber"
          >
            Voltar para o login
          </Link>
        </div>
      ) : (
        <>
          <header className="mb-10">
            <h1 className="font-display mb-2 text-headline-md text-coffee-roast">Esqueci minha senha</h1>
            <p className="text-on-surface-variant">
              Informe seu e-mail. Enviaremos um link de redefinição válido por 1 hora.
            </p>
          </header>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-label-md text-coffee-roast" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-coffee-roast px-6 py-4 text-title-lg text-paper-offwhite transition-colors duration-300 hover:bg-honey-amber active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? "Enviando..." : "Enviar link de redefinição"}
            </button>
            <div className="pt-4 text-center">
              <Link href="/login" className="text-label-md font-bold text-coffee-roast hover:text-honey-amber">
                Voltar para o login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
