"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import { leadStatusLabels } from "@/lib/labels";
import { Select } from "@/components/ui/Field";
import type { LeadStatus } from "@prisma/client";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateLeadStatus(leadId, e.target.value as LeadStatus))}
      className="flex items-center justify-between gap-2 rounded-md border border-[#DDD6C7] bg-white px-2 py-1 text-xs font-medium text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F] disabled:opacity-60"
    >
      {Object.entries(leadStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
