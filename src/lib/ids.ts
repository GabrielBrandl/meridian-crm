import { randomUUID } from "node:crypto";

export function uid() {
  return randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}
