import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { PaymentForm } from "@/components/invoices/PaymentForm";
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
          <h1 className="text-xl font-semibold text-gray-900">{invoice.client.name}</h1>
          {invoice.job && (
            <Link href={`/jobs/${invoice.job.id}`} className="text-sm text-blue-600 hover:underline">
              {invoice.job.jobNumber} · {invoice.job.title}
            </Link>
          )}
        </div>
        <Badge className="border-gray-200 bg-gray-100 text-gray-700">
          {invoiceStatusLabels[invoice.status]}
        </Badge>
      </div>

      <p className="text-xs text-gray-500">
        Issued {format(invoice.issueDate, "MMM d, yyyy")} · Due {format(invoice.dueDate, "MMM d, yyyy")}
      </p>

      <Card>
        <CardHeader title="Line items" />
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-2 font-medium">Description</th>
                <th className="px-5 py-2 font-medium">Qty</th>
                <th className="px-5 py-2 font-medium">Unit price</th>
                <th className="px-5 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="px-5 py-3 text-gray-900">{li.description}</td>
                  <td className="px-5 py-3 text-gray-600">{Number(li.quantity)}</td>
                  <td className="px-5 py-3 text-gray-600">{formatCurrency(li.unitPrice)}</td>
                  <td className="px-5 py-3 text-gray-900">{formatCurrency(li.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>HST (13%)</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Paid</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Balance</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Payments" />
        <CardBody className="space-y-4">
          {invoice.payments.length > 0 && (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-gray-600">
                    {format(p.paidAt, "MMM d, yyyy")} · {p.method.toLowerCase()}
                  </span>
                  <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          {balance > 0 ? (
            <PaymentForm invoiceId={invoice.id} />
          ) : (
            <p className="text-sm text-green-700">Paid in full.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
