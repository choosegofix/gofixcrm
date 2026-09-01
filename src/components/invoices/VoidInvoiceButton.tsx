"use client";

import { useTransition } from "react";
import { voidInvoice } from "@/app/actions/invoices";

export function VoidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Void this invoice? This can't be undone.")) {
          startTransition(() => voidInvoice(invoiceId));
        }
      }}
      className="text-xs font-medium text-[#8A93A3] hover:text-red-600 disabled:opacity-60"
    >
      Void invoice
    </button>
  );
}
