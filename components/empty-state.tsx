import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center animate-fade-up",
        className,
      )}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-background text-brand shadow-sm">
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
