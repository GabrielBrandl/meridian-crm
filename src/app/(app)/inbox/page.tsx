"use client";

import { useEffect, useState } from "react";
import { PageTitle, Card, btnPrimary, fieldClass } from "@/components/Shell";
import { formatPhone } from "@/lib/phone";

type Conversation = {
  id: string;
  name: string;
  phone: string;
  last_message: string;
  unread: number;
};

type Message = {
  id: string;
  direction: string;
  body: string;
  created_at: string;
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);

  async function loadInbox() {
    const response = await fetch("/api/inbox");
    const data = await response.json();
    setConversations(data.conversations || []);
    setReady(true);
  }

  async function openConversation(item: Conversation) {
    setSelected(item);
    const response = await fetch(`/api/inbox?id=${item.id}`);
    const data = await response.json();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    loadInbox();
  }, []);

  async function send() {
    if (!selected || !text.trim()) return;
    await fetch("/api/inbox/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: selected.phone, name: selected.name, body: text }),
    });
    setText("");
    openConversation(selected);
    loadInbox();
  }

  return (
    <div>
      <PageTitle title="Inbox" subtitle="Respostas das campanhas entram aqui. SAIR/PARAR descadastra automaticamente." />
      <div className="grid min-h-[640px] gap-4 md:grid-cols-[320px_1fr]">
        <Card>
          <div className="space-y-2">
            {conversations.map((item) => (
              <button
                key={item.id}
                onClick={() => openConversation(item)}
                className={`w-full rounded-xl px-3 py-3 text-left ${
                  selected?.id === item.id ? "bg-electric" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{item.name}</p>
                  {item.unread ? <span className="text-xs text-lilac">{item.unread}</span> : null}
                </div>
                <p className="truncate text-xs text-mist/60">{item.last_message}</p>
              </button>
            ))}
            {!ready ? <p className="text-sm text-mist/50">Carregando inbox...</p> : null}
            {ready && !conversations.length ? <p className="text-sm text-mist/50">Nenhuma conversa ainda.</p> : null}
          </div>
        </Card>
        <Card className="flex flex-col">
          {selected ? (
            <>
              <div className="mb-4 border-b border-white/10 pb-3">
                <p className="font-display font-bold">{selected.name}</p>
                <p className="text-xs text-mist/50">{formatPhone(selected.phone)}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      message.direction === "out" ? "ml-auto bg-electric" : "bg-white/10"
                    }`}
                  >
                    {message.body}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input className={fieldClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Responder..." />
                <button className={btnPrimary} onClick={send}>
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <p className="m-auto text-mist/50">Escolha uma conversa</p>
          )}
        </Card>
      </div>
    </div>
  );
}
