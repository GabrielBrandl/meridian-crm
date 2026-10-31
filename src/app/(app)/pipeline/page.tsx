"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/Shell";
import { formatPhone } from "@/lib/phone";

type CardItem = {
  id: string;
  contact_id: string;
  name: string;
  phone: string;
  value_cents: number;
  tags: string | null;
};

type Stage = {
  id: string;
  name: string;
  color: string;
  cards: CardItem[];
};

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);

  async function load() {
    const response = await fetch("/api/pipeline");
    const data = await response.json();
    setStages(data.stages || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function move(contactId: string, stageId: string) {
    const response = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, stageId }),
    });
    const data = await response.json();
    setStages(data.stages || []);
  }

  return (
    <div>
      <PageTitle title="Pipeline" subtitle="O mesmo contato da campanha vive no funil de vendas" />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <section key={stage.id} className="w-72 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold" style={{ color: stage.color }}>
                {stage.name}
              </h2>
              <span className="text-xs text-mist/50">{stage.cards.length}</span>
            </div>
            <div className="space-y-3">
              {stage.cards.map((card) => (
                <article key={card.id} className="rounded-xl bg-[#01033E]/70 p-3">
                  <p className="font-medium">{card.name}</p>
                  <p className="text-xs text-mist/50">{formatPhone(card.phone)}</p>
                  <p className="mt-1 text-xs text-lilac">{card.tags}</p>
                  <select
                    className="mt-3 w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs"
                    value={stage.id}
                    onChange={(e) => move(card.contact_id, e.target.value)}
                  >
                    {stages.map((item) => (
                      <option key={item.id} value={item.id}>
                        Mover para {item.name}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
