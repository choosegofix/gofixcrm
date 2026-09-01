"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function FilterSelect({
  paramName,
  label,
  options,
  allLabel = "All",
}: {
  paramName: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(paramName) ?? "";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function select(v: string) {
    setOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (v) {
      params.set(paramName, v);
    } else {
      params.delete(paramName);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectedLabel = options.find((o) => o.value === value)?.label ?? allLabel;

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5 text-sm text-[#5B6B82]">
      {label}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md border border-[#DDD6C7] bg-white px-2 py-1 text-sm text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F]"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#8A93A3]" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-60 min-w-full overflow-auto whitespace-nowrap rounded-md border border-[#DDD6C7] bg-white py-1 text-sm shadow-lg"
        >
          <li
            role="option"
            aria-selected={value === ""}
            onClick={() => select("")}
            className={
              value === ""
                ? "cursor-pointer px-3 py-1.5 font-medium text-[#D9480F]"
                : "cursor-pointer px-3 py-1.5 text-[#16233A] hover:bg-[#FAF7F1]"
            }
          >
            {allLabel}
          </li>
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => select(o.value)}
              className={
                o.value === value
                  ? "cursor-pointer px-3 py-1.5 font-medium text-[#D9480F]"
                  : "cursor-pointer px-3 py-1.5 text-[#16233A] hover:bg-[#FAF7F1]"
              }
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
