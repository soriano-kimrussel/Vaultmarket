import Link from "next/link";
import { ArrowUpRightIcon, LockIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ItemCover } from "@/components/items/item-cover";
import { cn, formatDate } from "@/lib/utils";
import type { Item } from "@/lib/types";

export function ItemCard({
  item,
  unlocked,
  isAdmin,
  isNew,
  className,
  style,
}: {
  item: Item;
  unlocked: boolean;
  isAdmin?: boolean;
  isNew?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      style={style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        isNew && "ring-2 ring-brand/60",
        className,
      )}
    >
      <ItemCover item={item} className="aspect-[16/9]">
        <div className="absolute top-3 left-3 flex gap-1.5">
          {item.category && <Badge variant="glass">{item.category}</Badge>}
          {isNew && (
            <Badge variant="glass" className="bg-brand/80">
              <SparklesIcon /> New
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-zinc-900 opacity-0 shadow-md transition-all duration-300 group-hover:opacity-100">
          <ArrowUpRightIcon className="size-4" />
        </div>
      </ItemCover>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-semibold tracking-tight">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary || "No public summary."}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          {isAdmin ? (
            <Badge variant="brand">
              <ShieldCheckIcon /> Admin access
            </Badge>
          ) : unlocked ? (
            <Badge variant="success">
              <ShieldCheckIcon /> Unlocked
            </Badge>
          ) : (
            <Badge variant="warning">
              <LockIcon /> NDA required
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
