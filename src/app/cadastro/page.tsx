"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { btnPrimary, fieldClass, Field } from "@/components/Shell";

export default function SignupPage() {
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "", password: "" });
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Não foi possível cadastrar");
      return;
    }
    setDone(data.message);
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-glow">
        <img src="/gb-logo.png" alt="GB Systems" className="h-12 mx-auto" />
        <h1 className="mt-5 text-center font-display text-2xl font-extrabold">Abrir workspace Meridian</h1>
        <p className="mt-2 text-center text-sm text-mist/70">A GB Systems revisa o pedido e libera o painel isolado da sua empresa. Depois você conecta o WhatsApp com QR.</p>
        {done ? (
          <div className="mt-8 text-center">
            <p className="text-lilac">{done}</p>
            <p className="mt-3 text-sm text-mist/60">Quando o status ficar ativo, use este mesmo e-mail e senha para entrar.</p>
            <Link href="/login" className={`${btnPrimary} mt-6`}>Ir para o login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <Field label="Empresa">
              <input className={fieldClass} placeholder="Nome da empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </Field>
            <Field label="Responsável">
              <input className={fieldClass} placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="E-mail de acesso">
              <input className={fieldClass} type="email" placeholder="voce@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="WhatsApp">
              <input className={fieldClass} placeholder="92 9 9999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Senha">
              <input className={fieldClass} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </Field>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <button className={`${btnPrimary} w-full`} disabled={loading}>{loading ? "Enviando..." : "Solicitar acesso"}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-mist/50"><Link href="/login">Já tenho conta</Link></p>
      </div>
    </div>
  );
}
