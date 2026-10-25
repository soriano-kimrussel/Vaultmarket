import { coverGradient, cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

export function ItemCover({
  item,
  className,
  children,
}: {
  item: Pick<Item, "id" | "title" | "cover_url" | "category">;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: coverGradient(item.category ?? item.id) }}>
      {item.cover_url ? (
        <img
          src={item.cover_url}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-grid opacity-30 mix-blend-overlay" />
          <div className="absolute -right-6 -bottom-10 text-[7rem] leading-none font-bold tracking-tighter text-white/15 select-none">
            {item.title.replace(/^Project\s+/i, "").slice(0, 2)}
          </div>
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      {children}
    </div>
  );
}
