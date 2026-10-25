import Link from "next/link";
import { LockKeyholeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand via-violet-500 to-fuchsia-500 text-white shadow-md shadow-brand/30 ring-1 ring-white/20 ring-inset",
        className,
      )}
    >
      <LockKeyholeIcon className="size-4" strokeWidth={2.4} />
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 font-semibold tracking-tight">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="text-[17px]">
        Vault<span className="text-muted-foreground">market</span>
      </span>
    </Link>
  );
}
