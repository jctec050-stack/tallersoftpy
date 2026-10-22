"use server";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifyPin,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

export async function loginWithPin(pin: string, rememberMe: boolean = true) {
  if (!verifyPin(pin)) {
    return { success: false, error: "PIN o contraseña maestra incorrecta." };
  }

  const { token, maxAge } = await createSessionToken(rememberMe);
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge,
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function checkAuthStatus() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(sessionToken);
  return { authenticated: isValid };
}
