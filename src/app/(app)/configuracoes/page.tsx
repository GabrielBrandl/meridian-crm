"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, fieldClass } from "@/components/Shell";

type Settings = {
  company_name: string;
  n8n_webhook_url: string;
  n8n_secret: string;
  n8n_callback_secret: string;
  sandbox_mode: number;
  messages_per_minute: number;
  daily_limit: number;
  min_interval_seconds: number;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  opt_out_keywords: string;
  pause_error_rate: number;
  require_opt_in: number;
  test_phone: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json();
    setSettings(data.settings);
    setSaved("Conexão e regras salvas.");
  }

  if (!settings) return <p className="text-mist/60">Carregando conexões...</p>;

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings({ ...settings, [key]: value });
  }

  return (
    <div>
      <PageTitle title="Ajustes de envio" subtitle="O WhatsApp conecta na página WhatsApp. Aqui ficam n8n, sandbox, horário e limites do workspace." />
      <form onSubmit={save} className="space-y-4">
        <Card className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">
            Empresa
            <input className={`${fieldClass} mt-1`} value={settings.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </label>
          <label className="col-span-2 text-sm">
            Webhook n8n (produção)
            <input className={`${fieldClass} mt-1`} value={settings.n8n_webhook_url} onChange={(e) => set("n8n_webhook_url", e.target.value)} placeholder="https://n8n.suaempresa.com/webhook/meridian-send" />
          </label>
          <label className="text-sm">
            Segredo de envio
            <input className={`${fieldClass} mt-1`} value={settings.n8n_secret} onChange={(e) => set("n8n_secret", e.target.value)} />
          </label>
          <label className="text-sm">
            Segredo de callback
            <input className={`${fieldClass} mt-1`} value={settings.n8n_callback_secret} onChange={(e) => set("n8n_callback_secret", e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input
              type="checkbox"
              checked={Boolean(settings.sandbox_mode)}
              onChange={(e) => set("sandbox_mode", e.target.checked ? 1 : 0)}
            />
            Modo sandbox (simula envio sem chamar o n8n — use para testar o CRM)
          </label>
        </Card>
        <Card className="grid grid-cols-3 gap-3">
          <label className="text-sm">
            Mensagens / minuto
            <input className={`${fieldClass} mt-1`} type="number" value={settings.messages_per_minute} onChange={(e) => set("messages_per_minute", Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Limite diário
            <input className={`${fieldClass} mt-1`} type="number" value={settings.daily_limit} onChange={(e) => set("daily_limit", Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Intervalo mínimo (s)
            <input className={`${fieldClass} mt-1`} type="number" value={settings.min_interval_seconds} onChange={(e) => set("min_interval_seconds", Number(e.target.value))} />
          </label>
          <label className="text-sm">
            Início
            <input className={`${fieldClass} mt-1`} value={settings.business_hours_start} onChange={(e) => set("business_hours_start", e.target.value)} />
          </label>
          <label className="text-sm">
            Fim
            <input className={`${fieldClass} mt-1`} value={settings.business_hours_end} onChange={(e) => set("business_hours_end", e.target.value)} />
          </label>
          <label className="text-sm">
            Fuso
            <input className={`${fieldClass} mt-1`} value={settings.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </label>
          <label className="text-sm col-span-2">
            Palavras de descadastro
            <input className={`${fieldClass} mt-1`} value={settings.opt_out_keywords} onChange={(e) => set("opt_out_keywords", e.target.value)} />
          </label>
          <label className="text-sm">
            Pausar se erro %
            <input className={`${fieldClass} mt-1`} type="number" value={settings.pause_error_rate} onChange={(e) => set("pause_error_rate", Number(e.target.value))} />
          </label>
        </Card>
        <button className={btnPrimary}>Salvar</button>
        {saved ? <p className="text-sm text-lilac">{saved}</p> : null}
      </form>
    </div>
  );
}
