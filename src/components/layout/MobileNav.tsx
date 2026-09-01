"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Logo } from "@/components/layout/Logo";

export function MobileNav({
  role,
  userName,
  roleLabel,
  signOutAction,
}: {
  role: string;
  userName: string;
  roleLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex items-center gap-2 font-semibold text-[#16233A]"
      >
        <Menu size={20} strokeWidth={2} />
        <Logo size="sm" />
        GoFix Services
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex h-dvh w-64 flex-col bg-[#16233A]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <div>
                  <p className="font-semibold text-white">GoFix Services</p>
                  <p className="text-xs text-[#8291A6]">CRM &amp; Field Ops</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-[#AEB9C9] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar role={role} onNavigate={() => setOpen(false)} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-[#8291A6]">{roleLabel}</p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-sm text-[#AEB9C9] hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
