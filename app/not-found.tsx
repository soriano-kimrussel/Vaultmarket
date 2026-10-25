import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer className="max-w-2xl">
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
