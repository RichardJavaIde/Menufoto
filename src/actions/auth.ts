//src/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

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
  const invalid = { error: "Correo o contraseña incorrectos", email: rawEmail };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return invalid;

  const valid = await compare(password, user.passwordHash);
  if (!valid) return invalid;

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}