"use client";

import { useEffect, useRef, useState } from "react";

const fieldClass =
  "block w-full rounded-md border border-[#DDD6C7] px-3 py-2 text-sm text-[#16233A] placeholder:text-[#8A93A3] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F]";

export function CrewMemberNameInput({
  name,
  existingNames,
  placeholder,
  required,
  id,
  className,
}: {
  name: string;
  existingNames: string[];
  placeholder?: string;
  required?: boolean;
  id?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const matches = existingNames.filter((n) => n.toLowerCase().includes(value.trim().toLowerCase()));
  const showSuggestions = open && value.trim().length > 0 && matches.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className ?? fieldClass}
      />
      {showSuggestions && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[#DDD6C7] bg-white py-1 text-sm shadow-lg"
        >
          {matches.map((n) => (
            <li
              key={n}
              role="option"
              aria-selected={n === value}
              onClick={() => {
                setValue(n);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-1.5 text-[#16233A] hover:bg-[#FAF7F1]"
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
