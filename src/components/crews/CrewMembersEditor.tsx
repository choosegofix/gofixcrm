"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

let nextId = 0;

export function CrewMembersEditor({ existingUserNames }: { existingUserNames: string[] }) {
  const [rows, setRows] = useState(() => [{ key: nextId++ }]);

  return (
    <div className="space-y-2">
      <input type="hidden" name="memberCount" value={rows.length} />
      <datalist id="crew-member-names">
        {existingUserNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      {rows.map((row, i) => (
        <div key={row.key} className="flex items-center gap-2">
          <Input
            name={`member_${i}`}
            list="crew-member-names"
            placeholder="Type a name — existing staff or a new one"
            className="flex-1"
          />
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
