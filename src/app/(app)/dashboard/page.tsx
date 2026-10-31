import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageTitle, btnPrimary } from "@/components/Shell";
import { getSession } from "@/lib/auth";
import { runWithUser } from "@/lib/context";
import { dashboard, getConnection } from "@/lib/repositories";
import { ensureBoot } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  ensureBoot();
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role === "platform") redirect("/admin");

  const { data, connection } = runWithUser(user, () => ({ data: dashboard(), connection: getConnection() as { status?: string } | null }));
  const cards = [
    ["Contatos", data.contacts],
    ["Com opt-in", data.optIn],
    ["Enviados hoje", data.sent],
    ["Respostas", data.replied],
    ["Campanhas ativas", data.running],
    ["Inbox não lida", data.unread],
  ];

  return (
    <div>
      <PageTitle
        title="Painel"
        subtitle={`Workspace ${user.tenantName || "Meridian"}`}
        action={<Link href="/campanhas" className={btnPrimary}>Nova campanha</Link>}
      />
      {connection?.status !== "connected" ? (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-lilac/30">
          <div>
            <p className="font-display font-bold">Conecte o WhatsApp da empresa</p>
            <p className="text-sm text-mist/70">Leia o QR no celular. Campanhas e inbox só saem pelo número deste workspace.</p>
          </div>
          <Link href="/conexoes" className={btnPrimary}>Abrir conexão</Link>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={String(label)}>
            <p className="text-xs uppercase tracking-widest text-mist/50">{label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-display text-lg font-bold">Campanhas recentes</h2>
          <div className="mt-4 space-y-3">
            {data.recent.map((campaign) => (
              <Link key={campaign.id} href={`/campanhas/${campaign.id}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-xs text-mist/50">{campaign.status}</p>
                </div>
                <p className="text-sm text-lilac">{campaign.metrics.sent}/{campaign.metrics.total}</p>
              </Link>
            ))}
            {!data.recent.length ? <p className="text-sm text-mist/50">Crie a primeira campanha depois de conectar o WhatsApp.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Funil</h2>
          <div className="mt-4 space-y-3">
            {data.funnel.map((stage) => (
              <div key={stage.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{stage.name}</span>
                  <span className="text-mist/60">{stage.total}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, stage.total * 12)}%`, background: stage.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
