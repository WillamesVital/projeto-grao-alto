"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";
import { registerAction, type FormState } from "@/actions/auth";

const initialState: FormState = { ok: false };

export default function CadastroPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [phone, setPhone] = useState("");

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    const match = digits.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
    if (!match) return setPhone(digits);
    const [, ddd, first, second] = match;
    setPhone(!first ? ddd : `(${ddd}) ${first}${second ? "-" + second : ""}`);
  }

  if (state.ok && state.message) {
    return (
      <AuthShell
        brandTitle="Bem-vindo ao ritual do café."
        brandBody="Junte-se à nossa comunidade de entusiastas e tenha acesso a seleções exclusivas dos melhores grãos de Pernambuco."
        brandImageSrc="/images/img-cadastro-login.png"
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-tertiary-fixed text-plantation-green">
            <span className="material-symbols-outlined text-4xl">mail</span>
          </div>
          <h2 className="font-display mb-4 text-headline-md text-coffee-roast">
            Verifique seu e-mail
          </h2>
          <p className="mb-8 leading-relaxed text-on-surface-variant">{state.message}</p>
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

  return (
    <AuthShell
      brandTitle="Bem-vindo ao ritual do café."
      brandBody="Junte-se à nossa comunidade de entusiastas e tenha acesso a seleções exclusivas dos melhores grãos de Pernambuco."
      brandImageSrc="/images/img-cadastro-login.png"
    >
      <header className="mb-10">
        <h1 className="font-display mb-2 text-headline-md text-coffee-roast">Crie sua conta</h1>
        <p className="text-on-surface-variant">Comece sua jornada sensorial conosco hoje mesmo.</p>
      </header>

      <form action={formAction} className="space-y-6">
        <div className="space-y-2">
          <label className="text-label-md text-coffee-roast" htmlFor="name">
            Nome Completo
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Ex: João Silva"
            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
          />
          {state.fieldErrors?.name && (
            <p className="text-label-sm text-error-red">{state.fieldErrors.name}</p>
          )}
        </div>

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
          {state.fieldErrors?.email && (
            <p className="text-label-sm text-error-red">{state.fieldErrors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-label-md text-coffee-roast" htmlFor="password">
              Senha
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
            {state.fieldErrors?.password && (
              <p className="text-label-sm text-error-red">{state.fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-label-md text-coffee-roast" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(81) 99999-9999"
              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-body-md transition-all focus:border-honey-amber focus:shadow-[0_0_0_1px_#D48806] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border-l-4 border-honey-amber bg-surface-container-low p-4">
          <span className="material-symbols-outlined mt-0.5 text-honey-amber">info</span>
          <p className="text-label-md leading-tight text-on-surface-variant">
            Enviaremos um link de confirmação para o seu e-mail após o cadastro. Por favor, verifique
            sua caixa de entrada.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-3 text-label-md text-on-surface-variant">
            <input
              type="checkbox"
              name="termsAccepted"
              required
              className="mt-1 h-4 w-4 rounded border-outline-variant text-coffee-roast focus:ring-honey-amber"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/sobre" className="font-bold text-coffee-roast hover:text-honey-amber">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/sobre" className="font-bold text-coffee-roast hover:text-honey-amber">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {state.fieldErrors?.termsAccepted && (
            <p className="text-label-sm text-error-red">{state.fieldErrors.termsAccepted}</p>
          )}
        </div>

        {state.message && !state.ok && (
          <p className="text-label-md text-error-red">{state.message}</p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-coffee-roast px-6 py-4 text-title-lg text-paper-offwhite transition-colors duration-300 hover:bg-honey-amber active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "Processando..." : "Criar minha conta"}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="pt-4 text-center">
          <p className="text-label-md text-on-surface-variant">
            Já possui uma conta?{" "}
            <Link href="/login" className="font-bold text-coffee-roast hover:text-honey-amber">
              Fazer Login
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
