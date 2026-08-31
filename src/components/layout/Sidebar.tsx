"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/leads", label: "Leads", roles: ["ADMIN", "OFFICE"] },
  { href: "/clients", label: "Clients", roles: ["ADMIN", "OFFICE"] },
  { href: "/quotes", label: "Quotes", roles: ["ADMIN", "OFFICE"] },
  { href: "/jobs", label: "Jobs", roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/schedule", label: "Schedule", roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/invoices", label: "Invoices", roles: ["ADMIN", "OFFICE"] },
  { href: "/crews", label: "Crews", roles: ["ADMIN", "OFFICE"] },
  { href: "/settings/users", label: "Team & Settings", roles: ["ADMIN"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 p-4">
      {visible.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
