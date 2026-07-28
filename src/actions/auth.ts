"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSessionCookie,
  destroySessionCookie,
  registerFailedLogin,
  resetFailedLogins,
  isLocked,
  bumpTokenVersion,
  getCurrentUser,
} from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { getRequestIp } from "@/lib/request";
import {
  issueEmailVerification,
  issuePasswordReset,
  peekPasswordReset,
  consumePasswordReset,
} from "@/lib/account-tokens";
import { sendMail, passwordChangedEmailHtml } from "@/lib/mailer";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation";

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    termsAccepted: formData.get("termsAccepted") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { ok: false, fieldErrors };
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "Este e-mail já tem uma conta. Faça login ou recupere sua senha.",
      fieldErrors: { email: "E-mail já cadastrado." },
    };
  }

  const passwordHash = await hashPassword(password);
  // RN-101.7 (LGPD): o aceite dos termos é registrado com data e IP.
  const ip = await getRequestIp();
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, termsAcceptedAt: new Date(), termsAcceptedIp: ip },
  });

  await issueEmailVerification(user.id, user.email);

  return { ok: true, message: "Cadastro realizado! Verifique seu e-mail para confirmar a conta." };
}

export async function resendVerificationAction(email: string): Promise<FormState> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.emailVerifiedAt) {
    return { ok: true, message: "Se existir uma conta pendente para este e-mail, reenviamos o link." };
  }
  await issueEmailVerification(user.id, user.email);
  return { ok: true, message: "E-mail de confirmação reenviado." };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: "Informe e-mail e senha válidos." };
  }

  const { email, password, rememberMe } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { ok: false, message: "E-mail ou senha incorretos." };
  }

  if (isLocked(user)) {
    const minutes = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60000);
    return {
      ok: false,
      message: `Muitas tentativas erradas. Tente novamente em ${minutes} min.`,
    };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    await registerFailedLogin(user.id);
    return { ok: false, message: "E-mail ou senha incorretos." };
  }

  await resetFailedLogins(user.id);
  await createSessionCookie(
    { sub: user.id, tokenVersion: user.tokenVersion, role: user.role },
    !!rememberMe,
  );
  await mergeGuestCartIntoUser(user.id);

  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}

/** Invalida a sessão em todos os dispositivos (bump no tokenVersion). */
export async function logoutAllDevicesAction() {
  const user = await getCurrentUser();
  if (user) await bumpTokenVersion(user.id);
  await destroySessionCookie();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: "Informe um e-mail válido." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    await issuePasswordReset(user.id, user.email);
  }

  return {
    ok: true,
    message: "Se este e-mail tiver uma conta, enviamos um link de redefinição.",
  };
}

export async function resetPasswordAction(
  token: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const peek = await peekPasswordReset(token);
  if (!peek.ok) {
    const messages: Record<string, string> = {
      not_found: "Link inválido.",
      used: "Este link já foi usado.",
      expired: "Este link expirou. Solicite uma nova redefinição.",
    };
    return { ok: false, message: messages[peek.reason] };
  }

  // RN-104.5: nova senha não pode ser igual à anterior — checa antes de
  // "queimar" o token, para o cliente poder tentar de novo com outra senha.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: peek.userId } });
  const samePassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (samePassword) {
    return { ok: false, message: "Escolha uma senha diferente da anterior." };
  }

  const result = await consumePasswordReset(token);
  if (!result.ok) {
    return { ok: false, message: "Este link já foi usado ou expirou." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: result.userId },
    data: { passwordHash, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null },
  });

  // RN-104.7: a conta é sempre notificada por e-mail quando a senha muda.
  await sendMail({
    to: user.email,
    subject: "Sua senha foi alterada — Grão Alto",
    html: passwordChangedEmailHtml(),
  });

  return { ok: true, message: "Senha redefinida com sucesso! Você já pode fazer login." };
}
