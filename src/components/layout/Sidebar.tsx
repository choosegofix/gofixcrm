"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  FileText,
  ClipboardList,
  Calendar,
  Receipt,
  HardHat,
  Settings,
  MapPin,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon; roles: string[] }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/leads", label: "Leads", icon: Target, roles: ["ADMIN", "OFFICE"] },
  { href: "/clients", label: "Clients", icon: Users, roles: ["ADMIN", "OFFICE"] },
  { href: "/quotes", label: "Quotes", icon: FileText, roles: ["ADMIN", "OFFICE"] },
  { href: "/jobs", label: "Jobs", icon: ClipboardList, roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/schedule", label: "Schedule", icon: Calendar, roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/map", label: "Map", icon: MapPin, roles: ["ADMIN", "OFFICE", "FIELD", "SUBCONTRACTOR"] },
  { href: "/invoices", label: "Invoices", icon: Receipt, roles: ["ADMIN", "OFFICE"] },
  { href: "/crews", label: "Crews", icon: HardHat, roles: ["ADMIN", "OFFICE"] },
  { href: "/settings/users", label: "Team & Settings", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {visible.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-[#D9480F] bg-white/10 text-white"
                : "border-transparent text-[#AEB9C9] hover:border-[#3A4A66] hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon
              size={17}
              strokeWidth={2}
              className={active ? "text-[#D9480F]" : "text-[#6E7C93] group-hover:text-[#AEB9C9]"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
