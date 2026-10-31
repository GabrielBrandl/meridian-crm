"use client";

import { useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, btnGhost } from "@/components/Shell";

type Connection = {
  id: string;
  name: string;
  provider: string;
  status: string;
  instance_name: string;
  phone_number?: string | null;
  qr_code?: string | null;
  notes?: string;
};

export default function WhatsAppPage() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [evolution, setEvolution] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/whatsapp/connect");
    const data = await response.json();
    setConnection(data.connection);
    setEvolution(Boolean(data.evolution));
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, []);

  async function connect() {
    setBusy("Gerando QR...");
    setError("");
    const response = await fetch("/api/whatsapp/connect", { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      setError(data.error || "Não foi possível gerar o QR");
      return;
    }
    setConnection(data.connection);
    setEvolution(true);
  }

  async function disconnect() {
    setBusy("Desconectando...");
    await fetch("/api/whatsapp/connect", { method: "DELETE" });
    setBusy("");
    load();
  }

  const status = connection?.status || "idle";
  const qr = connection?.qr_code || "";

  return (
    <div>
      <PageTitle
        title="Conectar WhatsApp"
        subtitle="Cada empresa lê o QR com o próprio WhatsApp Business. O número fica só no workspace dela."
      />
      <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs uppercase tracking-widest text-mist/50">Status do número</p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {status === "connected" ? "Conectado" : status === "qr" ? "Aguardando leitura" : "Desconectado"}
          </p>
          {connection?.phone_number ? <p className="mt-1 text-sm text-lilac">{connection.phone_number}</p> : null}
          <ol className="mt-5 space-y-3 text-sm text-mist/80">
            <li>1. Clique em <strong>Gerar QR Code</strong>.</li>
            <li>2. No celular, abra WhatsApp → Aparelhos conectados → Conectar um aparelho.</li>
            <li>3. Aponte a câmera para o QR. Em alguns segundos o status vira Conectado.</li>
            <li>4. Pronto: campanhas e inbox usam esse número, sem misturar com outros clientes.</li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className={btnPrimary} onClick={connect} disabled={!!busy}>
              {busy || (status === "connected" ? "Gerar novo QR" : "Gerar QR Code")}
            </button>
            {status === "connected" ? (
              <button className={btnGhost} onClick={disconnect} disabled={!!busy}>Desconectar</button>
            ) : null}
          </div>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          {!evolution ? (
            <p className="mt-4 text-sm text-amber-200">
              A Evolution API ainda não está publicada neste ambiente. No EasyPanel, depois que o serviço `evolution` subir, o QR funciona aqui. Enquanto isso, sandbox e n8n continuam em Ajustes.
            </p>
          ) : null}
        </Card>
        <Card className="grid min-h-[360px] place-items-center">
          {qr ? (
            <img src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`} alt="QR WhatsApp" className="h-64 w-64 rounded-xl bg-white p-2" />
          ) : status === "connected" ? (
            <p className="text-center text-lilac">WhatsApp conectado{connection?.phone_number ? ` · ${connection.phone_number}` : ""}.</p>
          ) : (
            <p className="text-center text-mist/50">O QR da sua empresa aparece aqui.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
