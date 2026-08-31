"use client";

import { useTransition } from "react";
import { updateJobStatus, removeAssignment } from "@/app/actions/jobs";
import { updateVisitStatus } from "@/app/actions/visits";
import { jobStatusLabels, visitStatusLabels } from "@/lib/labels";
import type { JobStatus, VisitStatus } from "@prisma/client";

export function JobStatusSelect({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => startTransition(() => updateJobStatus(jobId, e.target.value as JobStatus))}
      className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm font-medium text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F] disabled:opacity-60"
    >
      {Object.entries(jobStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function VisitStatusSelect({
  jobId,
  visitId,
  status,
}: {
  jobId: string;
  visitId: string;
  status: VisitStatus;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateVisitStatus(jobId, visitId, e.target.value as VisitStatus))
      }
      className="rounded-md border border-[#DDD6C7] px-2 py-1 text-xs font-medium text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F] disabled:opacity-60"
    >
      {Object.entries(visitStatusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function RemoveAssignmentButton({ jobId, assignmentId }: { jobId: string; assignmentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removeAssignment(jobId, assignmentId))}
      className="text-xs text-[#8A93A3] hover:text-red-600 disabled:opacity-60"
    >
      Remove
    </button>
  );
}
