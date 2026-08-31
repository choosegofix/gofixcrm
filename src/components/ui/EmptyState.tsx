import type { LucideIcon } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEEAE1] text-[#5B6B82]">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-sm font-medium text-[#16233A]">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-[#5B6B82]">{description}</p>
      {actionHref && actionLabel && (
        <LinkButton href={actionHref} size="sm" className="mt-4">
          {actionLabel}
        </LinkButton>
      )}
    </div>
  );
}
