import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";

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
        <Sidebar />
        <Topbar />

        {/*
          Padding lateral: 16px em mobile, 24px em tablet, 32px em desktop.
          Padding bottom: 80px em mobile para não colidir com o BottomNav (56px + folga).
        */}
        <main className="lg:pl-[264px]">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-10">
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
