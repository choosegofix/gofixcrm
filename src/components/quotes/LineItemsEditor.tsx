"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

let nextId = 0;

export type LineItemInit = {
  description: string;
  quantity: number;
  unitPrice: number;
  isOptional?: boolean;
};

export function LineItemsEditor({
  showOptional = true,
  initialItems,
}: {
  showOptional?: boolean;
  initialItems?: LineItemInit[];
}) {
  const [rows, setRows] = useState(() =>
    (initialItems && initialItems.length > 0 ? initialItems : [undefined]).map((item) => ({
      key: nextId++,
      item,
    }))
  );
  const rowGridClass = showOptional
    ? "grid grid-cols-[1fr_5rem_7rem_5rem_2rem] items-center gap-2"
    : "grid grid-cols-[1fr_5rem_7rem_2rem] items-center gap-2";
  const headerGridClass = showOptional
    ? "grid grid-cols-[1fr_5rem_7rem_5rem_2rem] gap-2 text-xs font-medium text-[#5B6B82]"
    : "grid grid-cols-[1fr_5rem_7rem_2rem] gap-2 text-xs font-medium text-[#5B6B82]";

  return (
    <div className="space-y-3">
      <input type="hidden" name="rowCount" value={rows.length} />
      <div className={headerGridClass}>
        <span>Description</span>
        <span>Qty</span>
        <span>Unit price</span>
        {showOptional && <span>Optional?</span>}
        <span></span>
      </div>
      {rows.map((row, i) => (
        <div key={row.key} className={rowGridClass}>
          <Input
            name={`desc_${i}`}
            required
            placeholder="e.g. Labour — replace capacitor"
            defaultValue={row.item?.description}
          />
          <Input
            name={`qty_${i}`}
            type="number"
            step="0.01"
            defaultValue={row.item ? row.item.quantity : "1"}
            required
          />
          <Input
            name={`price_${i}`}
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            defaultValue={row.item?.unitPrice}
          />
          {showOptional && (
            <input
              type="checkbox"
              name={`optional_${i}`}
              defaultChecked={row.item?.isOptional}
              className="h-4 w-4 justify-self-center"
            />
          )}
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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setRows((r) => [...r, { key: nextId++, item: undefined }])}
      >
        + Add line
      </Button>
    </div>
  );
}
