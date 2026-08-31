import Link from "next/link";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { invoiceStatusColors, invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import type { InvoiceStatus } from "@prisma/client";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { status } = await searchParams;
  const hasFilter = Boolean(status);

  const [invoices, allInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: company.id, ...(status ? { status: status as InvoiceStatus } : {}) },
      orderBy: { createdAt: "desc" },
      include: { client: true },
    }),
    prisma.invoice.findMany({
      where: { companyId: company.id },
      select: { status: true, total: true, amountPaid: true },
    }),
  ]);

  const outstanding = allInvoices
    .filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Invoices</h1>
          <p className="text-sm text-[#5B6B82]">{formatCurrency(outstanding)} outstanding</p>
        </div>
        <LinkButton href="/invoices/new">+ New invoice</LinkButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          paramName="status"
          label="Status"
          allLabel="All statuses"
          options={Object.entries(invoiceStatusLabels).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <Card>
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={hasFilter ? "No invoices match this filter" : "No invoices yet"}
              description={
                hasFilter
                  ? "Try a different status, or clear the filter to see every invoice."
                  : "Invoices are generated from a completed job."
              }
              actionHref={hasFilter ? "/invoices" : "/invoices/new"}
              actionLabel={hasFilter ? "Clear filter" : "+ New invoice"}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                <tr>
                  <th className="px-5 py-2 font-medium">Invoice</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF7F1]">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[#5B6B82]">{inv.client.name}</td>
                    <td className="px-5 py-3 text-[#5B6B82]">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3 text-[#5B6B82]">{format(inv.dueDate, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <Badge className={invoiceStatusColors[inv.status]}>{invoiceStatusLabels[inv.status]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
