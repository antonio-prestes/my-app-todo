"use server";

import { emailVerificationCodes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/db";
import bcrypt from "bcryptjs";
import {
  generateOtpCode,
  hashOtp,
  MAX_ATTEMPTS,
  verifyOtpHash,
} from "@/lib/email/otp";
import { sendVerificationEmail } from "@/lib/email/send-verification";

const CODE_TTL_MS = 15 * 60 * 1000;

/** Postgres / drivers podem devolver `timestamp` como string — evita crash em .getTime() */
function toUtcMs(value: unknown): number {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  const d = new Date(String(value));
  return d.getTime();
}

/** Gera OTP, persiste hash e envia e-mail (fluxo compartilhado: cadastro, reenvio, login não verificado). */
export async function issueVerificationCodeForUser(opts: {
  userId: string;
  email: string;
}): Promise<{ ok: true } | { ok: false }> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  const [inserted] = await db
    .insert(emailVerificationCodes)
    .values({
      userId: opts.userId,
      codeHash: hashOtp(code, opts.userId),
      expiresAt,
    })
    .returning({ id: emailVerificationCodes.id });
  try {
    await sendVerificationEmail(opts.email, code);
    return { ok: true };
  } catch {
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.id, inserted.id));
    return { ok: false };
  }
}

export async function signUpAndSendCode(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Campos obrigatórios" };
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return { error: "E-mail já cadastrado." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
    })
    .returning({ id: users.id });

  const sent = await issueVerificationCodeForUser({
    userId: user.id,
    email,
  });
  if (!sent.ok) {
    await db.delete(users).where(eq(users.id, user.id));
    return { error: "Erro ao enviar e-mail de verificação." };
  }

  return { success: true, userId: user.id };
}

/**
 * Após login falhar com e-mail não verificado: confirma senha de novo e devolve userId para a página de OTP.
 * Não envia novo e-mail (o authorize já disparou issueVerificationCodeForUser).
 */
export async function getVerifyRedirectForUnverifiedUser(
  email: string,
  password: string,
): Promise<{ userId: string } | { error: true }> {
  const normalized = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  if (!user) return { error: true };
  const match = await bcrypt.compare(password, user.password);
  if (!match) return { error: true };
  if (user.emailVerified) return { error: true };
  return { userId: user.id };
}

export async function confirmEmailCode(userId: string, code: string) {
  const uid = userId.trim();
  const pin = code.trim();
  if (!uid || !pin) {
    return { error: "Código inválido." };
  }

  try {
    const rows = await db
      .select()
      .from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, uid))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);
    const row = rows[0];
    if (!row) return { error: "Código inválido." };

    if (toUtcMs(row.expiresAt) < Date.now()) {
      return { error: "Código expirado." };
    }

    const attempts = Number(row.attempts ?? 0);
    if (attempts >= MAX_ATTEMPTS) {
      return { error: "Muitas tentativas. Solicite um novo código." };
    }

    const ok = verifyOtpHash(pin, uid, row.codeHash);

    await db
      .update(emailVerificationCodes)
      .set({ attempts: attempts + 1 })
      .where(eq(emailVerificationCodes.id, row.id));

    if (!ok) {
      return { error: "Código incorreto." };
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, uid));

    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, uid));

    return { success: true as const };
  } catch (e) {
    console.error("[confirmEmailCode]", e);
    return {
      error:
        "Não foi possível confirmar o código. Verifique o banco de dados ou tente novamente.",
    };
  }
}

export async function resendVerificationCode(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user || user.emailVerified) {
    return { error: "Não é possível reenviar." };
  }
  const sent = await issueVerificationCodeForUser({
    userId: user.id,
    email: user.email,
  });
  if (!sent.ok) {
    return { error: "Erro ao enviar e-mail." };
  }
  return { success: true };
}
