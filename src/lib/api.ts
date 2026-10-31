import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { runWithUser } from "./context";
import { ensureBoot } from "./seed";
import type { SessionUser } from "./types";

export async function requireUser() {
  ensureBoot();
  const user = await getSession();
  if (!user) throw new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });
  return user;
}

export async function withAuth<T>(fn: (user: SessionUser) => Promise<T> | T) {
  const user = await requireUser();
  return runWithUser(user, () => fn(user));
}

export async function requirePlatform() {
  const user = await requireUser();
  if (user.role !== "platform") {
    throw new Response(JSON.stringify({ error: "Acesso restrito à GB Systems" }), { status: 403 });
  }
  return user;
}

export async function withPlatform<T>(fn: (user: SessionUser) => Promise<T> | T) {
  const user = await requirePlatform();
  return runWithUser(user, () => fn(user));
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown, status = 400) {
  if (error instanceof Response) {
    return error.headers.get("content-type")?.includes("json")
      ? error
      : NextResponse.json({ error: "Não autenticado" }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Erro inesperado";
  return NextResponse.json({ error: message }, { status });
}
