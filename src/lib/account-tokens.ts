import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";
import {
  sendMail,
  confirmationEmailHtml,
  passwordResetEmailHtml,
} from "@/lib/mailer";

const EMAIL_TOKEN_HOURS = 24;
const RESET_TOKEN_HOURS = 1;

export async function issueEmailVerification(userId: string, email: string) {
  const rawToken = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_HOURS * 60 * 60 * 1000),
    },
  });

  const confirmUrl = `${process.env.APP_URL}/cadastro/confirmar/${rawToken}`;
  await sendMail({
    to: email,
    subject: "Confirme seu cadastro — Grão Alto",
    html: confirmationEmailHtml(confirmUrl),
  });
}

export type ConsumeTokenResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_found" | "expired" | "used" };

export async function consumeEmailVerification(rawToken: string): Promise<ConsumeTokenResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record) return { ok: false, reason: "not_found" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true, userId: record.userId };
}

export async function issuePasswordReset(userId: string, email: string) {
  const rawToken = generateRawToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.APP_URL}/redefinir-senha/${rawToken}`;
  await sendMail({
    to: email,
    subject: "Redefinição de senha — Grão Alto",
    html: passwordResetEmailHtml(resetUrl),
  });
}

/** Confere validade do token sem marcá-lo como usado — permite checar a
 * RN-104.5 (nova senha != anterior) antes de "queimar" o link. */
export async function peekPasswordReset(rawToken: string): Promise<ConsumeTokenResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return { ok: false, reason: "not_found" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, userId: record.userId };
}

export async function consumePasswordReset(rawToken: string): Promise<ConsumeTokenResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return { ok: false, reason: "not_found" };
  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

  return { ok: true, userId: record.userId };
}
