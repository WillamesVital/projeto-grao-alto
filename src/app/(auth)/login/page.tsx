"use client";

import { useActionState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import { loginAction, type FormState } from "@/actions/auth";

const initialState: FormState = { ok: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <AuthShell
      brandTitle="Que bom te ver de novo."
      brandBody="Continue de onde parou: seu carrinho e seus pedidos estão te esperando."
      brandImageSrc="/images/img-cadastro-login.png"
    >
      <header className="mb-10">
        <h1 className="font-display mb-2 text-headline-md text-coffee-roast">Entrar na conta</h1>
        <p className="text-on-surface-variant">Acesse para acompanhar seus pedidos e finalizar compras.</p>
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

        <div className="space-y-2">
          <label className="text-label-md text-coffee-roast" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Sua senha"
            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-label-md">
          <label className="flex items-center gap-2 text-on-surface-variant">
            <input name="rememberMe" type="checkbox" className="h-4 w-4 rounded border-outline-variant text-coffee-roast" />
            Continuar conectado
          </label>
          <Link href="/esqueci-senha" className="font-bold text-coffee-roast hover:text-honey-amber">
            Esqueci minha senha
          </Link>
        </div>

        {state.message && !state.ok && (
          <p className="text-label-md text-error-red">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coffee-roast px-6 py-4 text-title-lg text-paper-offwhite transition-colors duration-300 hover:bg-honey-amber active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "Entrando..." : "Entrar"}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>

        <div className="pt-4 text-center">
          <p className="text-label-md text-on-surface-variant">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-bold text-coffee-roast hover:text-honey-amber">
              Criar minha conta
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
