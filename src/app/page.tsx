import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureBoot } from "@/lib/seed";
const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-electric px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-110";
const btnGhost =
  "inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-mist hover:bg-white/5";

const STEPS = [
  ["1", "Cadastro", "A empresa solicita acesso ou a GB Systems cria o workspace já liberado."],
  ["2", "Aprovação", "No painel da GB, você aprova, escolhe o plano e libera o login do cliente."],
  ["3", "WhatsApp", "O cliente entra no próprio painel e lê o QR com o WhatsApp Business da empresa."],
  ["4", "Operação", "Contatos com opt-in, funil, campanhas e inbox ficam isolados por cliente."],
];

const PLANS = [
  ["Starter", "250 envios/dia", "Para começar a operação com uma base pequena."],
  ["Pro", "2.000 envios/dia", "Para times que já disparam e acompanham o funil."],
  ["Enterprise", "10.000 envios/dia", "Para operação maior, com mais volume e usuários."],
];

export default async function Home() {
  ensureBoot();
  const user = await getSession();
  if (user) redirect(user.role === "platform" ? "/admin" : "/dashboard");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <img src="/gb-logo.png" alt="GB Systems" className="h-10 w-auto" />
        <div className="flex gap-3">
          <Link href="/login" className={btnGhost}>Entrar</Link>
          <Link href="/cadastro" className={btnPrimary}>Solicitar acesso</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="mt-10 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-lilac">Meridian CRM · GB Systems</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            CRM comercial de WhatsApp para a sua operação vender mais.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-mist/75">
            Cada cliente tem o próprio workspace, o próprio número e a própria base. A GB Systems cadastra, aprova e acompanha. Sem mistura de dados entre empresas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className={btnPrimary}>Abrir meu workspace</Link>
            <Link href="/login" className={btnGhost}>Já tenho acesso</Link>
          </div>
        </section>
        <section className="mt-16 grid gap-4 md:grid-cols-4">
          {STEPS.map(([step, title, text]) => (
            <article key={step} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-display text-2xl font-extrabold text-lilac">{step}</p>
              <h2 className="mt-2 font-display text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm text-mist/70">{text}</p>
            </article>
          ))}
        </section>
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="font-display text-2xl font-extrabold">Como o cliente conecta o WhatsApp</h2>
          <ol className="mt-4 grid gap-3 text-sm text-mist/80 md:grid-cols-2">
            <li>1. Entra no painel da empresa e abre <strong>WhatsApp</strong>.</li>
            <li>2. Clica em <strong>Gerar QR Code</strong>.</li>
            <li>3. No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho.</li>
            <li>4. Lê o QR. O status vira Conectado e as campanhas usam esse número.</li>
          </ol>
        </section>
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map(([name, limit, text]) => (
            <article key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-widest text-lilac">{name}</p>
              <p className="mt-2 font-display text-2xl font-extrabold">{limit}</p>
              <p className="mt-2 text-sm text-mist/70">{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
