import { Wrench } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? 16 : 18;
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-sm`}
    >
      <Wrench size={icon} strokeWidth={2.25} />
    </div>
  );
}
