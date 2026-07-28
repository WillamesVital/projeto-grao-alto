import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "ga_session";
const DEFAULT_SESSION_SECONDS = 60 * 60 * 24; // 24h sem "continuar conectado"
const REMEMBER_SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  tokenVersion: number;
  role: "CUSTOMER" | "ADMIN";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(user: SessionPayload, rememberMe: boolean) {
  const maxAge = rememberMe ? REMEMBER_SESSION_SECONDS : DEFAULT_SESSION_SECONDS;
  const token = await new SignJWT({ tokenVersion: user.tokenVersion, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      tokenVersion: Number(payload.tokenVersion ?? 0),
      role: (payload.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    };
  } catch {
    return null;
  }
}

/** Retorna o usuário autenticado só se o token da sessão ainda bate com o
 * tokenVersion atual no banco — permite invalidar todas as sessões (logout
 * em outros dispositivos, redefinição de senha) sem precisar de tabela de
 * sessão. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return null;
  if (user.tokenVersion !== session.tokenVersion) return null;

  return user;
}

export async function registerFailedLogin(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: { increment: 1 } },
  });

  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        failedLoginAttempts: 0,
      },
    });
  }
}

export async function resetFailedLogins(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

export function isLocked(user: { lockedUntil: Date | null }) {
  return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
}

export async function bumpTokenVersion(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
