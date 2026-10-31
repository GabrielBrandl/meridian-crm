"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageTitle, Card, btnPrimary, btnGhost } from "@/components/Shell";
import { formatPhone } from "@/lib/phone";

type Campaign = {
  id: string;
  name: string;
  message: string;
  status: string;
  metrics: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    replied: number;
    failed: number;
    deliveryRate: number;
    replyRate: number;
  };
  recipients: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    error: string | null;
    rendered_message: string;
  }>;
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [busy, setBusy] = useState("");

  async function load() {
    const response = await fetch(`/api/campaigns/${params.id}`);
    const data = await response.json();
    setCampaign(data.campaign);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [params.id]);

  async function action(path: string, label: string, body: object = {}) {
    setBusy(label);
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetch("/api/dispatch/tick", { method: "POST" });
    await load();
    setBusy("");
  }

  if (!campaign) return <p className="text-mist/60">Carregando campanha...</p>;

  const metrics = [
    ["Fila", campaign.metrics.pending],
    ["Enviados", campaign.metrics.sent],
    ["Entregues", campaign.metrics.delivered],
    ["Lidos", campaign.metrics.read],
    ["Respostas", campaign.metrics.replied],
    ["Falhas", campaign.metrics.failed],
  ];

  return (
    <div>
      <PageTitle
        title={campaign.name}
        subtitle={`${campaign.status} · entrega ${campaign.metrics.deliveryRate}% · resposta ${campaign.metrics.replyRate}%`}
        action={
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => action(`/api/campaigns/${campaign.id}/pause`, "pause")}>
              Pausar
            </button>
            <button
              className={btnPrimary}
              disabled={!!busy}
              onClick={() => action(`/api/campaigns/${campaign.id}/start`, "start")}
            >
              {busy || "Disparar agora"}
            </button>
          </div>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        {metrics.map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs text-mist/50">{label}</p>
            <p className="font-display text-2xl font-extrabold">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="mb-5">
        <p className="text-xs uppercase tracking-widest text-mist/50">Mensagem</p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{campaign.message}</p>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-mist/50">
            <tr>
              <th className="pb-3">Contato</th>
              <th className="pb-3">Telefone</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {campaign.recipients.map((recipient) => (
              <tr key={recipient.id} className="border-t border-white/5 align-top">
                <td className="py-3">{recipient.name}</td>
                <td>{formatPhone(recipient.phone)}</td>
                <td className="uppercase text-lilac">{recipient.status}</td>
                <td className="max-w-md text-mist/70">
                  {recipient.rendered_message}
                  {recipient.error ? <p className="text-red-300">{recipient.error}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
