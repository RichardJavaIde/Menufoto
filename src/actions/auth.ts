//src/actions/auth.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { blockedMinutes, clearFailures, registerFailure } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string };

const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, email: rawEmail };
  }

  const { email, password } = parsed.data;
  const emailKey = `email:${email}`;
  const ipKey = `ip:${await clientIp()}`;

  const wait = Math.max(
    blockedMinutes(emailKey, MAX_PER_EMAIL),
    blockedMinutes(ipKey, MAX_PER_IP)
  );
  if (wait > 0) {
    return {
      error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${wait} min.`,
      email: rawEmail,
    };
  }

  const invalid = () => {
    registerFailure(emailKey);
    registerFailure(ipKey);
    return { error: "Correo o contraseña incorrectos", email: rawEmail };
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return invalid();

  const valid = await compare(password, user.passwordHash);
  if (!valid) return invalid();

  clearFailures(emailKey);
  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}