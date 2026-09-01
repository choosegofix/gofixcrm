"use client";

import {
  Children,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";

const fieldClass =
  "block w-full rounded-md border border-[#DDD6C7] px-3 py-2 text-sm text-[#16233A] placeholder:text-[#8A93A3] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F]";

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-[#3A4A5F]">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (props, ref) => (
    <textarea ref={ref} {...props} className={`${fieldClass} ${props.className ?? ""}`} />
  )
);
Textarea.displayName = "Textarea";

// A custom-rendered dropdown, not a native <select>. Windows Chrome ignores
// custom web fonts (e.g. a variable font like Geist) inside the native
// popup list specifically, even though the closed box respects them — so a
// real <select> always looks font-mismatched once opened. This renders its
// own popup (full font control) while keeping a hidden native <select> in
// sync so it still works as a normal form field (name, required, FormData).
export function Select({
  children,
  className,
  onChange,
  value,
  defaultValue,
  required,
  disabled,
  id,
  name,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const options = useMemo(() => {
    const out: { value: string; label: string; disabled?: boolean }[] = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === "option") {
        const props = child.props as { value?: string; children?: React.ReactNode; disabled?: boolean };
        out.push({
          value: String(props.value ?? props.children ?? ""),
          label: String(props.children ?? ""),
          disabled: props.disabled,
        });
      }
    });
    return out;
  }, [children]);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(String(defaultValue ?? ""));
  const current = isControlled ? String(value) : internal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function commit(v: string) {
    if (!isControlled) setInternal(v);
    setOpen(false);
    const el = selectRef.current;
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")!.set!;
      setter.call(el, v);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  const selected = options.find((o) => o.value === current);

  return (
    <div ref={rootRef} className="relative">
      <select
        ref={selectRef}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={isControlled ? current : undefined}
        defaultValue={isControlled ? undefined : current}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </select>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          className ??
          `${fieldClass} bg-white flex items-center justify-between disabled:opacity-60`
        }
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[#8A93A3]" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full min-w-max overflow-auto rounded-md border border-[#DDD6C7] bg-white py-1 text-sm shadow-lg"
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === current}
              onClick={() => !o.disabled && commit(o.value)}
              className={
                o.disabled
                  ? "cursor-not-allowed px-3 py-1.5 text-[#B8C0CC]"
                  : o.value === current
                    ? "cursor-pointer bg-[#FBE7DB] px-3 py-1.5 font-medium text-[#D9480F]"
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

export function FormField({
  label,
  htmlFor,
  required,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#5B6B82]">{hint}</p>}
    </div>
  );
}
