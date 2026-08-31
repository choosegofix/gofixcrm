import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { quoteStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

export default async function QuotesPage() {
  await requireUser();
  const company = await getCompany();

  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500">
            {quotes.length} quote{quotes.length === 1 ? "" : "s"}
          </p>
        </div>
        <LinkButton href="/quotes/new">+ New quote</LinkButton>
      </div>

      <Card>
        <CardBody className="p-0">
          {quotes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No quotes yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Quote</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Created</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/quotes/${q.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {q.quoteNumber} · {q.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{q.client.name}</td>
                    <td className="px-5 py-3 text-gray-600">{formatCurrency(q.total)}</td>
                    <td className="px-5 py-3 text-gray-600">{format(q.createdAt, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <Badge className="border-gray-200 bg-gray-100 text-gray-700">
                        {quoteStatusLabels[q.status]}
                      </Badge>
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
