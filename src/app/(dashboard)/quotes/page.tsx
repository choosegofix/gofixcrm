import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { quoteStatusColors, quoteStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import type { QuoteStatus, Trade } from "@prisma/client";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; trade?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { status, trade } = await searchParams;
  const hasFilter = Boolean(status || trade);

  const quotes = await prisma.quote.findMany({
    where: {
      companyId: company.id,
      ...(status ? { status: status as QuoteStatus } : {}),
      ...(trade ? { trade: trade as Trade } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Quotes</h1>
          <p className="text-sm text-[#5B6B82]">
            {quotes.length} quote{quotes.length === 1 ? "" : "s"}
          </p>
        </div>
        <LinkButton href="/quotes/new">+ New quote</LinkButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          paramName="status"
          label="Status"
          allLabel="All statuses"
          options={Object.entries(quoteStatusLabels).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          paramName="trade"
          label="Trade"
          allLabel="All trades"
          options={Object.entries(tradeLabels).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <Card>
        <CardBody className="p-0">
          {quotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={hasFilter ? "No quotes match these filters" : "No quotes yet"}
              description={
                hasFilter
                  ? "Try different filters, or clear them to see every quote."
                  : "Build a quote for a client, or convert one from a lead."
              }
              actionHref={hasFilter ? "/quotes" : "/quotes/new"}
              actionLabel={hasFilter ? "Clear filters" : "+ New quote"}
            />
          ) : (
            <>
              <ul className="divide-y divide-[#EFEAE0] lg:hidden">
                {quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/quotes/${q.id}`} className="block px-4 py-3 transition hover:bg-[#FAF7F1]">
                      <p className="font-medium text-[#16233A]">
                        {q.quoteNumber} · {q.title}
                      </p>
                      <p className="text-xs text-[#5B6B82]">{q.client.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge className={tradeColors[q.trade]}>{tradeLabels[q.trade]}</Badge>
                        <Badge className={quoteStatusColors[q.status]}>{quoteStatusLabels[q.status]}</Badge>
                        <span className="tabular-nums ml-auto font-mono text-xs text-[#5B6B82]">
                          {formatCurrency(q.total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                    <tr>
                      <th className="px-5 py-2 font-medium">Quote</th>
                      <th className="px-5 py-2 font-medium">Client</th>
                      <th className="px-5 py-2 font-medium">Trade</th>
                      <th className="px-5 py-2 font-medium">Total</th>
                      <th className="px-5 py-2 font-medium">Created</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-[#FAF7F1]">
                        <td className="px-5 py-3">
                          <Link href={`/quotes/${q.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                            {q.quoteNumber} · {q.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-[#5B6B82]">{q.client.name}</td>
                        <td className="px-5 py-3">
                          <Badge className={tradeColors[q.trade]}>{tradeLabels[q.trade]}</Badge>
                        </td>
                        <td className="px-5 py-3 text-[#5B6B82]">{formatCurrency(q.total)}</td>
                        <td className="px-5 py-3 text-[#5B6B82]">{format(q.createdAt, "MMM d, yyyy")}</td>
                        <td className="px-5 py-3">
                          <Badge className={quoteStatusColors[q.status]}>{quoteStatusLabels[q.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
