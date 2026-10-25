"use client";

import { useEffect } from "react";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="max-w-2xl">
      <EmptyState
        icon={AlertTriangleIcon}
        title="Something went wrong"
        description={error.message || "An unexpected error occurred. Please try again."}
        action={
          <Button onClick={reset}>
            <RotateCcwIcon /> Try again
          </Button>
        }
      />
    </PageContainer>
  );
}
