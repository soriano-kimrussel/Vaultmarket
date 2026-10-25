import { PageContainer } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer className="max-w-5xl">
      <div className="mb-10 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-5">
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
      </div>
    </PageContainer>
  );
}
