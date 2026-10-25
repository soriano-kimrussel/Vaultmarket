import Link from "next/link";
import { PackageSearchIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function ItemNotFound() {
  return (
    <PageContainer className="max-w-2xl">
      <EmptyState
        icon={PackageSearchIcon}
        title="Listing not found"
        description="It may have been removed, or the link is incorrect."
        action={
          <Button asChild>
            <Link href="/marketplace">Back to marketplace</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
