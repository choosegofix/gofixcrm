import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { invoiceStatusColors, invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { PaymentForm } from "@/components/invoices/PaymentForm";
import { TicketHeader } from "@/components/ui/TicketHeader";
import { format } from "date-fns";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      job: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const balance = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <TicketHeader
        kind="Invoice"
        number={invoice.invoiceNumber}
        title={invoice.client.name}
        meta={
          invoice.job ? (
            <Link href={`/jobs/${invoice.job.id}`} className="text-[#D9480F] hover:underline">
              {invoice.job.jobNumber} · {invoice.job.title}
            </Link>
          ) : (
            `Issued ${format(invoice.issueDate, "MMM d, yyyy")} · Due ${format(invoice.dueDate, "MMM d, yyyy")}`
          )
        }
        status={
          <Badge className={invoiceStatusColors[invoice.status]}>
            {invoiceStatusLabels[invoice.status]}
          </Badge>
        }
        action={
          <span className="text-xs text-[#5B6B82]">
            Issued {format(invoice.issueDate, "MMM d")} · Due {format(invoice.dueDate, "MMM d, yyyy")}
          </span>
        }
      />

      <Card>
        <CardHeader title="Line items" />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E3DDD0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
              <tr>
                <th className="px-5 py-2 font-medium">Description</th>
                <th className="px-5 py-2 font-medium">Qty</th>
                <th className="px-5 py-2 font-medium">Unit price</th>
                <th className="px-5 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE0]">
              {invoice.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="px-5 py-3 text-[#16233A]">{li.description}</td>
                  <td className="tabular-nums px-5 py-3 font-mono text-[#5B6B82]">
                    {Number(li.quantity)}
                  </td>
                  <td className="tabular-nums px-5 py-3 font-mono text-[#5B6B82]">
                    {formatCurrency(li.unitPrice)}
                  </td>
                  <td className="tabular-nums px-5 py-3 font-mono text-[#16233A]">
                    {formatCurrency(li.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#E3DDD0] px-5 py-4">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-[#5B6B82]">
                <span>Subtotal</span>
                <span className="tabular-nums font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#5B6B82]">
                <span>HST (13%)</span>
                <span className="tabular-nums font-mono">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#16233A]">
                <span>Total</span>
                <span className="tabular-nums font-mono">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-[#5B6B82]">
                <span>Paid</span>
                <span className="tabular-nums font-mono">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#16233A]">
                <span>Balance</span>
                <span className="tabular-nums font-mono">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payments" />
        <CardBody className="space-y-4">
          {invoice.payments.length > 0 && (
            <ul className="divide-y divide-[#EFEAE0] rounded-md border border-[#E3DDD0]">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-[#5B6B82]">
                    {format(p.paidAt, "MMM d, yyyy")} · {p.method.toLowerCase()}
                  </span>
                  <span className="tabular-nums font-mono font-medium text-[#16233A]">
                    {formatCurrency(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {balance > 0 ? (
            <PaymentForm invoiceId={invoice.id} />
          ) : (
            <p className="text-sm font-medium text-[#1F5C33]">Paid in full.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
