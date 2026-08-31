import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex min-h-screen bg-[#FAF7F1]">
      <aside className="hidden w-60 shrink-0 bg-[#16233A] md:block">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Logo size="sm" />
          <div>
            <p className="font-semibold text-white">GoFix Services</p>
            <p className="text-xs text-[#8291A6]">CRM &amp; Field Ops</p>
          </div>
        </div>
        <Sidebar role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#E3DDD0] bg-white px-6 py-3">
          <MobileNav role={user.role} />
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell notifications={notifications} />
            <div className="text-right">
              <p className="text-sm font-medium text-[#16233A]">{user.name}</p>
              <p className="text-xs text-[#5B6B82]">{roleLabels[user.role as Role]}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#16233A] hover:bg-[#FAF7F1]"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
