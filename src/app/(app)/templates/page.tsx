"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, fieldClass } from "@/components/Shell";

type Template = { id: string; name: string; body: string; category: string };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  async function load() {
    const response = await fetch("/api/templates");
    const data = await response.json();
    setTemplates(data.templates || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, body }),
    });
    setName("");
    setBody("");
    load();
  }

  return (
    <div>
      <PageTitle title="Modelos" subtitle="Mensagens reutilizáveis com variáveis de personalização" />
      <Card className="mb-6">
        <form onSubmit={create} className="space-y-3">
          <input className={fieldClass} placeholder="Nome do modelo" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className={`${fieldClass} min-h-28`} placeholder="Olá {{primeiro_nome}}..." value={body} onChange={(e) => setBody(e.target.value)} />
          <button className={btnPrimary} disabled={!name || !body}>
            Salvar modelo
          </button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <p className="text-xs uppercase tracking-widest text-lilac">{template.category}</p>
            <h2 className="mt-1 font-display font-bold">{template.name}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-mist/70">{template.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
