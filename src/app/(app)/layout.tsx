import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureBoot } from "@/lib/seed";
import { Shell } from "@/components/Shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  ensureBoot();
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <Shell role={user.role} tenantName={user.tenantName} userName={user.name}>
      {children}
    </Shell>
  );
}
