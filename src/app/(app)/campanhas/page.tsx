"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PageTitle, Card, btnPrimary, btnGhost, fieldClass } from "@/components/Shell";

type Campaign = {
  id: string;
  name: string;
  status: string;
  message: string;
  metrics: { total: number; sent: number; replied: number; failed: number };
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; body: string }>>([]);
  const [form, setForm] = useState({ name: "", message: "", tagId: "", stageId: "" });
  const [preview, setPreview] = useState<number | null>(null);

  async function load() {
    const [c, t, p, m] = await Promise.all([
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/pipeline").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]);
    setCampaigns(c.campaigns || []);
    setTags(t.tags || []);
    setStages((p.stages || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
    setTemplates(m.templates || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function previewAudience() {
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preview: true,
        tagIds: form.tagId ? [form.tagId] : [],
        stageId: form.stageId || null,
        onlyOptIn: true,
      }),
    });
    const data = await response.json();
    setPreview(data.total ?? 0);
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        message: form.message,
        tagIds: form.tagId ? [form.tagId] : [],
        stageId: form.stageId || null,
        onlyOptIn: true,
      }),
    });
    setForm({ name: "", message: "", tagId: "", stageId: "" });
    load();
  }

  return (
    <div>
      <PageTitle title="Campanhas" subtitle="Disparo segmentado, com opt-in e intervalo seguro via n8n" />
      <Card className="mb-6">
        <form onSubmit={create} className="space-y-3">
          <input className={fieldClass} placeholder="Nome da campanha" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select
            className={fieldClass}
            value=""
            onChange={(e) => {
              const template = templates.find((item) => item.id === e.target.value);
              if (template) setForm({ ...form, message: template.body });
            }}
          >
            <option value="">Usar modelo salvo</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <textarea
            className={`${fieldClass} min-h-28`}
            placeholder="Mensagem. Variáveis: {{nome}} {{primeiro_nome}} {{empresa}} {{cidade}}"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className={fieldClass} value={form.tagId} onChange={(e) => setForm({ ...form, tagId: e.target.value })}>
              <option value="">Todas as tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <select className={fieldClass} value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}>
              <option value="">Todas as etapas</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className={btnGhost} onClick={previewAudience}>
              Prévia da audiência
            </button>
            {preview !== null ? <span className="text-sm text-lilac">{preview} contatos elegíveis</span> : null}
            <button className={btnPrimary} disabled={!form.name || !form.message}>
              Criar rascunho
            </button>
          </div>
        </form>
      </Card>
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Link key={campaign.id} href={`/campanhas/${campaign.id}`} className="block">
            <Card className="mb-3 flex items-center justify-between hover:bg-white/[0.07]">
              <div>
                <p className="font-display font-bold">{campaign.name}</p>
                <p className="text-xs uppercase tracking-widest text-mist/50">{campaign.status}</p>
              </div>
              <p className="text-sm text-mist/70">
                {campaign.metrics.sent}/{campaign.metrics.total} enviados · {campaign.metrics.replied} respostas
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
