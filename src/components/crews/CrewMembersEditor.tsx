"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PersonNameInput } from "@/components/ui/PersonNameInput";

let nextId = 0;

export function CrewMembersEditor({ existingUserNames }: { existingUserNames: string[] }) {
  const [rows, setRows] = useState(() => [{ key: nextId++ }]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="memberCount" value={rows.length} />
      {rows.map((row, i) => (
        <div key={row.key} className="flex items-center gap-2">
          <div className="flex-1">
            <PersonNameInput
              name={`member_${i}`}
              existingNames={existingUserNames}
              placeholder="Type a name — existing staff or a new one"
            />
          </div>
          <button
            type="button"
            onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
            disabled={rows.length === 1}
            className="text-xs text-[#8A93A3] hover:text-red-600 disabled:opacity-30"
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { key: nextId++ }])}>
        + Add another
      </Button>
    </div>
  );
}
