import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SessionProvider } from "@/components/layout/SessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Topbar />

        {/*
          Padding lateral: 16px em mobile, 24px em tablet, 32px em desktop.
          Padding bottom: 80px em mobile para não colidir com o BottomNav (56px + folga).
        */}
        <main>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-8">
            <div className="page-enter">
              {children}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </SessionProvider>
  );
}
