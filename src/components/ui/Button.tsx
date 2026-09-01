import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

const variants = {
  primary:
    "bg-[#D9480F] text-white hover:bg-[#B83A0A] focus-visible:outline-[#D9480F]",
  secondary:
    "bg-white text-[#16233A] border border-[#DDD6C7] hover:bg-[#FAF7F1] focus-visible:outline-[#5B6B82]",
  danger:
    "bg-[#8C2F1F] text-white hover:bg-[#732416] focus-visible:outline-[#8C2F1F]",
  ghost: "text-[#5B6B82] hover:bg-[#EEEAE1] focus-visible:outline-[#5B6B82]",
};

const sizes = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className = "", variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  />
));
Button.displayName = "Button";

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
