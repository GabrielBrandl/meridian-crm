import { AsyncLocalStorage } from "node:async_hooks";
import type { SessionUser } from "./types";

type Store = {
  tenantId: string | null;
  user: SessionUser;
};

const storage = new AsyncLocalStorage<Store>();

export function runWithUser<T>(user: SessionUser, fn: () => T): T {
  return storage.run({ tenantId: user.tenantId, user }, fn);
}

export function currentUser() {
  return storage.getStore()?.user ?? null;
}

export function tenantId() {
  const id = storage.getStore()?.tenantId;
  if (!id) throw new Error("Esta ação precisa de um workspace de cliente.");
  return id;
}

export function optionalTenantId() {
  return storage.getStore()?.tenantId ?? null;
}
