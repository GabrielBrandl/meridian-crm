"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Megaphone,
  Inbox,
  FileText,
  Settings,
  LogOut,
  Building2,
  Smartphone,
  Menu,
  X,
} from "lucide-react";

const CLIENT_NAV = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/templates", label: "Modelos", icon: FileText },
  { href: "/conexoes", label: "WhatsApp", icon: Smartphone },
  { href: "/configuracoes", label: "Ajustes", icon: Settings },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Clientes", icon: Building2 },
];

export function Shell({
  children,
  role = "admin",
  tenantName,
  userName,
}: {
  children: React.ReactNode;
  role?: string;
  tenantName?: string | null;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "platform" ? ADMIN_NAV : CLIENT_NAV;
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
        <img src="/gb-logo.png" alt="GB Systems" className="h-8 w-auto" />
        <button className={btnGhost} onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>
      {open ? <button className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" /> : null}
      <aside
        className={`${open ? "flex" : "hidden"} md:flex fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#01033E] px-4 py-6 flex-col`}
      >
        <Link href={role === "platform" ? "/admin" : "/dashboard"} className="px-2" onClick={() => setOpen(false)}>
          <img src="/gb-logo.png" alt="GB Systems" className="h-9 w-auto" />
        </Link>
        <p className="mt-4 px-2 text-[10px] uppercase tracking-[0.22em] text-lilac">
          {role === "platform" ? "Painel GB Systems" : "Meridian CRM"}
        </p>
        {tenantName ? <p className="px-2 mt-1 text-xs text-mist/70 truncate">{tenantName}</p> : null}
        <nav className="mt-7 space-y-1 flex-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-electric text-white shadow-glow" : "text-mist/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 pb-2 text-xs text-mist/50 truncate">{userName}</div>
        <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mist/70 hover:bg-white/5">
          <LogOut size={16} />
          Sair
        </button>
      </aside>
      <main className="min-h-screen px-4 py-6 md:px-8 md:py-7">{children}</main>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-mist/70 max-w-2xl">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 ${className}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-mist/80">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist/50">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-[#01033E]/60 px-3 py-2.5 text-sm text-white placeholder:text-mist/40";
export const btnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-electric px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:brightness-110 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm text-mist hover:bg-white/5";
