"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RadioIcon, SearchIcon, SearchXIcon, XIcon } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/types";

const ALL = "__all__";

export function MarketplaceBrowser({
  initialItems,
  unlockedIds,
  isAdmin,
}: {
  initialItems: Item[];
  unlockedIds: string[];
  isAdmin: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const unlocked = useMemo(() => new Set(unlockedIds), [unlockedIds]);

  useEffect(() => setItems(initialItems), [initialItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("items-feed")
      .on<Item>("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, (payload) => {
        const item = payload.new;
        setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [item, ...prev]));
        setFreshIds((prev) => new Set(prev).add(item.id));
        toast("New listing just dropped", { description: item.title, icon: <RadioIcon className="size-4 text-brand" /> });
      })
      .on<Item>("postgres_changes", { event: "UPDATE", schema: "public", table: "items" }, (payload) => {
        setItems((prev) => prev.map((i) => (i.id === payload.new.id ? { ...i, ...payload.new } : i)));
      })
      .on<Item>("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, (payload) => {
        setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[])).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== ALL && item.category !== category) return false;
      if (!q) return true;
      return [item.title, item.summary, item.category].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, deferredQuery, category]);

  const hasFilters = query.length > 0 || category !== ALL;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/60 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings by name, summary or category…"
            className="border-transparent bg-background pl-9 shadow-none"
            aria-label="Search listings"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full border-transparent bg-background shadow-none sm:w-48" aria-label="Category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div
            className={cn(
              "hidden h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium sm:flex",
              live ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
            title={live ? "Realtime connected" : "Connecting to realtime…"}
          >
            <span className="relative flex size-2">
              {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
              <span className={cn("relative inline-flex size-2 rounded-full", live ? "bg-emerald-500" : "bg-muted-foreground/50")} />
            </span>
            {live ? "Live" : "Connecting"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
          {hasFilters && ` of ${items.length}`}
        </span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setCategory(ALL);
            }}
          >
            <XIcon /> Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title={items.length === 0 ? "No listings yet" : "Nothing matches your search"}
          description={
            items.length === 0
              ? "New listings will appear here in real time as soon as an admin publishes them."
              : "Try a different keyword or clear the category filter."
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              unlocked={unlocked.has(item.id)}
              isAdmin={isAdmin}
              isNew={freshIds.has(item.id)}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
