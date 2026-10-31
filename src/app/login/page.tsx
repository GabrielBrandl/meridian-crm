"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { btnPrimary, fieldClass, Field } from "@/components/Shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Falha no login");
      return;
    }
    router.push(data.redirect || "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-glow">
        <img src="/gb-logo.png" alt="GB Systems" className="h-12 mx-auto" />
        <p className="mt-5 text-center text-[11px] uppercase tracking-[0.28em] text-lilac">Meridian CRM</p>
        <h1 className="mt-2 text-center font-display text-2xl font-extrabold">Entre no seu workspace</h1>
        <p className="mt-2 text-center text-sm text-mist/60">Clientes entram no painel da própria empresa. A GB Systems entra no painel de cadastro.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="E-mail">
            <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" required />
          </Field>
          <Field label="Senha">
            <input className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" required />
          </Field>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button className={`${btnPrimary} w-full`} disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-mist/70">
          Empresa nova? <Link href="/cadastro" className="text-lilac">Solicitar acesso</Link>
        </p>
      </div>
    </div>
  );
}
