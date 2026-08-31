import Link from "next/link";
import { Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { formatLeadSource, leadStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { areaColor } from "@/lib/serviceArea";
import { LeadStatusSelect } from "@/components/leads/LeadStatusSelect";
import { format } from "date-fns";
import type { LeadStatus, Trade } from "@prisma/client";

const pipeline: LeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string; area?: string; source?: string; status?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { trade, area, source, status } = await searchParams;
  const hasFilter = Boolean(trade || area || source || status);

  const [leads, allLeadsForPipeline, areas, sourcesRaw] = await Promise.all([
    prisma.lead.findMany({
      where: {
        companyId: company.id,
        ...(trade ? { trade: trade as Trade } : {}),
        ...(area ? { serviceAreaId: area } : {}),
        ...(source ? { source } : {}),
        ...(status ? { status: status as LeadStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { client: true, property: true, serviceArea: true },
    }),
    prisma.lead.findMany({ where: { companyId: company.id }, select: { status: true } }),
    prisma.serviceArea.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: { companyId: company.id, source: { not: null } },
      distinct: ["source"],
      select: { source: true },
    }),
  ]);
  const sources = sourcesRaw.map((s) => s.source).filter((s): s is string => !!s);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Leads</h1>
          <p className="text-sm text-[#5B6B82]">Inbound work requests, before they&apos;re quoted</p>
        </div>
        <LinkButton href="/leads/new">+ New lead</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {pipeline.map((s) => (
          <Card key={s}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-[#5B6B82]">
                {leadStatusLabels[s]}
              </p>
              <p className="mt-1 text-xl font-semibold text-[#16233A]">
                {allLeadsForPipeline.filter((l) => l.status === s).length}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          paramName="status"
          label="Status"
          allLabel="All statuses"
          options={Object.entries(leadStatusLabels).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          paramName="trade"
          label="Trade"
          allLabel="All trades"
          options={Object.entries(tradeLabels).map(([value, label]) => ({ value, label }))}
        />
        {areas.length > 0 && (
          <FilterSelect
            paramName="area"
            label="Area"
            allLabel="All areas"
            options={areas.map((a) => ({ value: a.id, label: a.name }))}
          />
        )}
        {sources.length > 0 && (
          <FilterSelect
            paramName="source"
            label="Source"
            allLabel="All sources"
            options={sources.map((s) => ({ value: s, label: formatLeadSource(s) ?? s }))}
          />
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          {leads.length === 0 ? (
            <EmptyState
              icon={Target}
              title={hasFilter ? "No leads match these filters" : "No leads yet"}
              description={
                hasFilter
                  ? "Try different filters, or clear them to see every lead."
                  : "New work requests show up here before they're quoted."
              }
              actionHref={hasFilter ? "/leads" : "/leads/new"}
              actionLabel={hasFilter ? "Clear filters" : "+ New lead"}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                <tr>
                  <th className="px-5 py-2 font-medium">Contact</th>
                  <th className="px-5 py-2 font-medium">Trade</th>
                  <th className="px-5 py-2 font-medium">Area</th>
                  <th className="px-5 py-2 font-medium">Received</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#16233A]">{l.contactName}</p>
                      <p className="text-xs text-[#5B6B82]">
                        {l.client ? l.client.name : l.contactEmail || l.contactPhone || "New prospect"}
                        {formatLeadSource(l.source) && ` · ${formatLeadSource(l.source)}`}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={tradeColors[l.trade]}>{tradeLabels[l.trade]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {l.serviceArea ? (
                        <Badge className={areaColor(l.serviceArea.name)}>{l.serviceArea.name}</Badge>
                      ) : (
                        <span className="text-xs text-[#8A93A3]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#5B6B82]">{format(l.createdAt, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <LeadStatusSelect leadId={l.id} status={l.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.clientId && l.propertyId ? (
                        <Link
                          href={`/quotes/new?leadId=${l.id}&clientId=${l.clientId}&propertyId=${l.propertyId}`}
                          className="text-xs font-medium text-[#D9480F] hover:underline"
                        >
                          Create quote →
                        </Link>
                      ) : (
                        <span className="text-xs text-[#8A93A3]">Add a client to quote</span>
                      )}
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
