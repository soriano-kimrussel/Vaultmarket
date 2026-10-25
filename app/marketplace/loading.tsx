import { PageContainer } from "@/components/page-header";
import { ItemGridSkeleton } from "@/components/items/item-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer>
      <div className="mb-10 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="mb-8 h-16 w-full rounded-2xl" />
      <ItemGridSkeleton />
    </PageContainer>
  );
}
