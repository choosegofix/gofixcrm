"use client";

import { useTransition } from "react";
import { toggleTask } from "@/app/actions/tasks";

export function TaskCheckbox({
  jobId,
  taskId,
  completed,
}: {
  jobId: string;
  taskId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <input
      type="checkbox"
      checked={completed}
      disabled={pending}
      onChange={() => startTransition(() => toggleTask(jobId, taskId))}
      className="h-4 w-4 rounded border-[#DDD6C7] text-[#D9480F] focus:ring-[#D9480F]"
    />
  );
}
