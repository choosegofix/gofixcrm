"use client";

import { useTransition } from "react";
import { markQuoteSent, approveQuote, declineQuote } from "@/app/actions/quotes";
import { Button } from "@/components/ui/Button";
import type { QuoteStatus } from "@prisma/client";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const [pending, startTransition] = useTransition();

  if (status === "APPROVED" || status === "DECLINED" || status === "EXPIRED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => markQuoteSent(quoteId))}
        >
          Mark as sent
        </Button>
      )}
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => approveQuote(quoteId))}
      >
        Record client approval →
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => declineQuote(quoteId))}
      >
        Mark declined
      </Button>
    </div>
  );
}
