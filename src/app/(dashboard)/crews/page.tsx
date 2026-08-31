import Link from "next/link";
import { HardHat } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { crewTypeLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { areaColor } from "@/lib/serviceArea";
import type { Trade, CrewType } from "@prisma/client";

export default async function CrewsPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string; area?: string; type?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { trade, area, type } = await searchParams;
  const hasFilter = Boolean(trade || area || type);

  const [crews, areas] = await Promise.all([
    prisma.crew.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        ...(trade ? { trades: { has: trade as Trade } } : {}),
        ...(type ? { type: type as CrewType } : {}),
        ...(area ? { serviceAreas: { some: { serviceAreaId: area } } } : {}),
      },
      orderBy: { name: "asc" },
      include: { members: { include: { user: true } }, serviceAreas: { include: { serviceArea: true } } },
    }),
    prisma.serviceArea.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Crews</h1>
          <p className="text-sm text-[#5B6B82]">Internal crews and subcontractors</p>
        </div>
        <LinkButton href="/crews/new">+ New crew</LinkButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          paramName="trade"
          label="Trade"
          allLabel="All trades"
          options={Object.entries(tradeLabels).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          paramName="type"
          label="Type"
          allLabel="All types"
          options={Object.entries(crewTypeLabels).map(([value, label]) => ({ value, label }))}
        />
        {areas.length > 0 && (
          <FilterSelect
            paramName="area"
            label="Area"
            allLabel="All areas"
            options={areas.map((a) => ({ value: a.id, label: a.name }))}
          />
        )}
      </div>

      {crews.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={HardHat}
              title={hasFilter ? "No crews match these filters" : "No crews yet"}
              description={
                hasFilter
                  ? "Try different filters, or clear them to see every crew."
                  : "Add your first crew to start assigning jobs."
              }
              actionHref={hasFilter ? "/crews" : "/crews/new"}
              actionLabel={hasFilter ? "Clear filters" : "+ New crew"}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crews.map((c) => (
            <Link key={c.id} href={`/crews/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[#16233A]">{c.name}</p>
                      <p className="text-xs text-[#5B6B82]">{crewTypeLabels[c.type]}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.trades.map((t) => (
                      <Badge key={t} className={tradeColors[t]}>
                        {tradeLabels[t]}
                      </Badge>
                    ))}
                    {c.serviceAreas.map((sa) => (
                      <Badge key={sa.serviceAreaId} className={areaColor(sa.serviceArea.name)}>
                        {sa.serviceArea.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[#5B6B82]">
                    {c.members.length} member{c.members.length === 1 ? "" : "s"}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
