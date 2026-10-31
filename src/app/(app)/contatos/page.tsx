"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, btnGhost, fieldClass } from "@/components/Shell";
import { formatPhone } from "@/lib/phone";

type Contact = {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  city: string | null;
  opt_in: number;
  tags: string | null;
  stage_name: string | null;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", company: "", city: "", tags: "" });
  const [message, setMessage] = useState("");

  async function load(query = q) {
    const response = await fetch(`/api/contacts?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setContacts(data.contacts || []);
  }

  useEffect(() => {
    load("");
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setOpen(false);
    setForm({ name: "", phone: "", company: "", city: "", tags: "" });
    load();
  }

  async function importCsv() {
    const response = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, optIn: true }),
    });
    const data = await response.json();
    setMessage(`${data.created} criados, ${data.updated} atualizados, ${data.skipped} ignorados`);
    setCsv("");
    load();
  }

  return (
    <div>
      <PageTitle
        title="Contatos"
        subtitle="Base com opt-in, tags e etapa do funil"
        action={
          <button className={btnPrimary} onClick={() => setOpen((v) => !v)}>
            Novo contato
          </button>
        }
      />
      <div className="mb-5 flex gap-3">
        <input
          className={fieldClass}
          placeholder="Buscar nome, telefone, empresa..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button className={btnGhost} onClick={() => load()}>
          Buscar
        </button>
      </div>
      {open ? (
        <Card className="mb-5">
          <form onSubmit={create} className="grid gap-3 md:grid-cols-5">
            <input className={fieldClass} placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={fieldClass} placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={fieldClass} placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input className={fieldClass} placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className={fieldClass} placeholder="Tags, separadas" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <button className={`${btnPrimary} col-span-5`}>Salvar com opt-in</button>
          </form>
        </Card>
      ) : null}
      <Card className="mb-5">
        <p className="mb-2 text-sm text-mist/70">Importar CSV: nome,telefone,email,empresa,cidade,tags,opt_in</p>
        <textarea className={`${fieldClass} min-h-24`} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className={`${btnGhost} mt-3`} onClick={importCsv} disabled={!csv.trim()}>
          Importar lista
        </button>
        {message ? <p className="mt-2 text-sm text-lilac">{message}</p> : null}
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-mist/50">
            <tr>
              <th className="pb-3">Nome</th>
              <th className="pb-3">WhatsApp</th>
              <th className="pb-3">Empresa</th>
              <th className="pb-3">Etapa</th>
              <th className="pb-3">Tags</th>
              <th className="pb-3">Opt-in</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-t border-white/5">
                <td className="py-3">{contact.name}</td>
                <td>{formatPhone(contact.phone)}</td>
                <td>{contact.company}</td>
                <td>{contact.stage_name}</td>
                <td className="text-lilac">{contact.tags}</td>
                <td>{contact.opt_in ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
