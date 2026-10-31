"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, btnGhost, fieldClass, Field } from "@/components/Shell";

type Tenant = {
  id: string;
  name: string;
  plan: string;
  status: string;
  owner_name: string;
  owner_email: string;
  users: number;
  contacts: number;
  sent_today: number;
};

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState({ tenants: 0, pending: 0, active: 0, contacts: 0, sentToday: 0 });
  const [plan, setPlan] = useState("starter");
  const [created, setCreated] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/tenants");
    const data = await response.json();
    setTenants(data.tenants || []);
    setStats(data.stats || stats);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreated("");
    setSaving(true);
    const dataForm = new FormData(event.currentTarget);
    const payload = {
      name: String(dataForm.get("name") || ""),
      ownerName: String(dataForm.get("ownerName") || ""),
      ownerEmail: String(dataForm.get("ownerEmail") || ""),
      password: String(dataForm.get("password") || ""),
      phone: String(dataForm.get("phone") || ""),
      plan,
    };
    const response = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Não criou o cliente");
      return;
    }
    setCreated(`Cliente ${data.tenant.name} liberado. Login: ${data.login.email} / senha definida agora.`);
    event.currentTarget.reset();
    setPlan("starter");
    load();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/tenants/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <PageTitle title="Clientes" subtitle="Cadastre empresas, aprove pedidos e libere o workspace isolado de cada uma." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["Empresas", stats.tenants],
          ["Ativas", stats.active],
          ["Aguardando", stats.pending],
          ["Contatos", stats.contacts],
          ["Envios hoje", stats.sentToday],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs text-mist/50">{label}</p>
            <p className="font-display text-2xl font-extrabold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="mb-6">
        <h2 className="font-display font-bold mb-1">Cadastrar cliente</h2>
        <p className="mb-4 text-sm text-mist/60">O cliente já entra ativo, com painel próprio e tela de QR do WhatsApp.</p>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-3">
          <Field label="Empresa">
            <input className={fieldClass} name="name" placeholder="Oficina Amazonas" required />
          </Field>
          <Field label="Responsável">
            <input className={fieldClass} name="ownerName" placeholder="Ricardo Silva" required />
          </Field>
          <Field label="E-mail de acesso">
            <input className={fieldClass} type="email" name="ownerEmail" placeholder="ricardo@oficina.com" required />
          </Field>
          <Field label="Senha inicial (visível para você copiar e enviar ao cliente)">
            <input className={fieldClass} type="text" name="password" autoComplete="off" placeholder="Mínimo 6 caracteres" required minLength={6} />
          </Field>
          <Field label="WhatsApp">
            <input className={fieldClass} name="phone" placeholder="92 9 9999-9999" />
          </Field>
          <Field label="Plano">
            <select className={fieldClass} name="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="starter">Starter · 250 envios/dia</option>
              <option value="pro">Pro · 2.000 envios/dia</option>
              <option value="enterprise">Enterprise · 10.000 envios/dia</option>
            </select>
          </Field>
          <button type="submit" className={`${btnPrimary} md:col-span-3`} disabled={saving}>
            {saving ? "Criando..." : "Criar e liberar acesso"}
          </button>
        </form>
        {created ? <p className="mt-3 text-sm text-lilac">{created}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-mist/50">
            <tr>
              <th className="pb-3">Empresa</th>
              <th className="pb-3">Responsável</th>
              <th className="pb-3">Plano</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Uso</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className={`border-t border-white/5 ${tenant.status === "pending" ? "bg-amber-400/5" : ""}`}>
                <td className="py-3">{tenant.name}</td>
                <td>{tenant.owner_name}<br /><span className="text-xs text-mist/50">{tenant.owner_email}</span></td>
                <td className="uppercase">{tenant.plan}</td>
                <td className={tenant.status === "pending" ? "text-amber-200" : tenant.status === "suspended" ? "text-red-300" : "text-lilac"}>{tenant.status}</td>
                <td>{tenant.contacts} contatos · {tenant.sent_today} hoje</td>
                <td className="space-x-2 whitespace-nowrap">
                  {tenant.status !== "active" ? <button className={btnGhost} onClick={() => setStatus(tenant.id, "active")}>Aprovar</button> : null}
                  {tenant.status !== "suspended" ? <button className={btnGhost} onClick={() => setStatus(tenant.id, "suspended")}>Suspender</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
