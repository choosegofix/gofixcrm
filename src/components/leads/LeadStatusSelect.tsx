"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/app/actions/leads";
import { leadStatusLabels } from "@/lib/labels";
import type { LeadStatus } from "@prisma/client";

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateLeadStatus(leadId, e.target.value as LeadStatus))}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
    >
      {Object.entries(leadStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
