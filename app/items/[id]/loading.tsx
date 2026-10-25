import { PageContainer } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer className="max-w-6xl">
      <Skeleton className="mb-6 h-8 w-28" />
      <Skeleton className="h-56 rounded-3xl sm:h-72" />
      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      </div>
    </PageContainer>
  );
}
