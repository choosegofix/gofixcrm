import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { quoteStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { QuoteActions } from "@/components/quotes/QuoteActions";
import { DepositForm } from "@/components/quotes/DepositForm";
import { format } from "date-fns";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      property: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      job: true,
    },
  });

  if (!quote) notFound();

  const deposits = quote.depositRequired
    ? await prisma.payment.findMany({
        where: { clientId: quote.clientId, type: "DEPOSIT", notes: { contains: quote.quoteNumber } },
        orderBy: { paidAt: "desc" },
      })
    : [];
  const depositPaid = deposits.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{quote.quoteNumber}</p>
          <h1 className="text-xl font-semibold text-gray-900">{quote.title}</h1>
          <p className="text-sm text-gray-500">
            {quote.client.name} — {quote.property.addressLine1}
          </p>
        </div>
        <Badge className="border-gray-200 bg-gray-100 text-gray-700">
          {quoteStatusLabels[quote.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={tradeColors[quote.trade]}>{tradeLabels[quote.trade]}</Badge>
        {quote.validUntil && (
          <span className="text-xs text-gray-500">Valid until {format(quote.validUntil, "MMM d, yyyy")}</span>
        )}
        {quote.job && (
          <Link href={`/jobs/${quote.job.id}`} className="text-xs font-medium text-blue-600 hover:underline">
            View job {quote.job.jobNumber} →
          </Link>
        )}
      </div>

      <QuoteActions quoteId={quote.id} status={quote.status} />

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
              {quote.lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="px-5 py-3 text-gray-900">
                    {li.description}
                    {li.isOptional && (
                      <span className="ml-2 text-xs font-medium text-amber-600">Optional</span>
                    )}
                  </td>
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
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>HST (13%)</span>
                <span>{formatCurrency(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
              {quote.depositRequired && (
                <div className="flex justify-between text-gray-600">
                  <span>Deposit required</span>
                  <span>{formatCurrency(quote.depositRequired)}</span>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {quote.depositRequired && (
        <Card>
          <CardHeader
            title="Deposit"
            subtitle={`${formatCurrency(depositPaid)} of ${formatCurrency(quote.depositRequired)} recorded`}
          />
          <CardBody>
            <DepositForm quoteId={quote.id} />
          </CardBody>
        </Card>
      )}

      {(quote.notes || quote.termsAndConditions) && (
        <Card>
          <CardHeader title="Notes & terms" />
          <CardBody className="space-y-3 text-sm text-gray-700">
            {quote.notes && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Internal notes</p>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.termsAndConditions && (
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Terms & conditions</p>
                <p className="whitespace-pre-wrap">{quote.termsAndConditions}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
