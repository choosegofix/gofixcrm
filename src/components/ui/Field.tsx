import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

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

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} bg-white ${props.className ?? ""}`} />;
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
