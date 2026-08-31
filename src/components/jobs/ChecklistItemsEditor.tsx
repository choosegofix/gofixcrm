"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

let nextId = 0;

export function ChecklistItemsEditor() {
  const [rows, setRows] = useState(() => [{ key: nextId++ }]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="rowCount" value={rows.length} />
      <div className="grid grid-cols-[1fr_6rem_2rem] gap-2 text-xs font-medium text-[#5B6B82]">
        <span>Task</span>
        <span>Photo required?</span>
        <span></span>
      </div>
      {rows.map((row, i) => (
        <div key={row.key} className="grid grid-cols-[1fr_6rem_2rem] items-center gap-2">
          <Input name={`title_${i}`} required placeholder="e.g. Confirm gas line pressure" />
          <input type="checkbox" name={`requiresPhoto_${i}`} className="h-4 w-4 justify-self-center" />
          <button
            type="button"
            onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
            disabled={rows.length === 1}
            className="text-xs text-[#8A93A3] hover:text-[#8C2F1F] disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setRows((r) => [...r, { key: nextId++ }])}
      >
        + Add task
      </Button>
    </div>
  );
}
