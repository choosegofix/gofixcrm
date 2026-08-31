import { requireUser } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="border-b border-gray-200 px-5 py-4">
          <p className="font-bold text-gray-900">GoFix Services</p>
          <p className="text-xs text-gray-500">CRM &amp; Field Ops</p>
        </div>
        <Sidebar role={user.role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="md:hidden font-bold text-gray-900">GoFix Services</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user.role as Role]}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
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
