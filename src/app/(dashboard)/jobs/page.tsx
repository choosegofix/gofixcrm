import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { getAssignedJobIds } from "@/lib/jobAccess";
import { areaColor } from "@/lib/serviceArea";
import {
  jobStatusColors,
  jobStatusLabels,
  jobStatusOrder,
  tradeColors,
  tradeLabels,
} from "@/lib/labels";
import { format } from "date-fns";
import type { JobStatus, Trade } from "@prisma/client";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; trade?: string; area?: string }>;
}) {
  const user = await requireUser();
  const company = await getCompany();
  const { status, trade, area } = await searchParams;

  const assignedJobIds = user.role === "SUBCONTRACTOR" ? await getAssignedJobIds(user.id) : null;

  const [jobs, areas] = await Promise.all([
    prisma.job.findMany({
      where: {
        companyId: company.id,
        ...(status ? { status: status as JobStatus } : {}),
        ...(trade ? { trade: trade as Trade } : {}),
        ...(area ? { property: { serviceAreaId: area } } : {}),
        ...(assignedJobIds ? { id: { in: assignedJobIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { client: true, property: { include: { serviceArea: true } } },
    }),
    prisma.serviceArea.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } }),
  ]);
  const hasFilter = Boolean(status || trade || area);

  function statusHref(s?: JobStatus) {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (trade) params.set("trade", trade);
    if (area) params.set("area", area);
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Jobs</h1>
          <p className="text-sm text-[#5B6B82]">{jobs.length} jobs</p>
        </div>
        {user.role !== "SUBCONTRACTOR" && <LinkButton href="/jobs/new">+ New job</LinkButton>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={statusHref(undefined)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !status ? "border-[#D9480F] bg-[#FBE7DB] text-[#D9480F]" : "border-[#E3DDD0] text-[#5B6B82]"
          }`}
        >
          All
        </Link>
        {jobStatusOrder.map((s) => (
          <Link
            key={s}
            href={statusHref(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s ? "border-[#D9480F] bg-[#FBE7DB] text-[#D9480F]" : "border-[#E3DDD0] text-[#5B6B82]"
            }`}
          >
            {jobStatusLabels[s]}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-[#E3DDD0]" />
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
      </div>

      <Card>
        <CardBody className="p-0">
          {jobs.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={hasFilter ? "No jobs match these filters" : "No jobs yet"}
              description={
                hasFilter
                  ? "Try different filters, or clear them to see every job."
                  : user.role === "SUBCONTRACTOR"
                    ? "You'll see jobs here once the office assigns one to you."
                    : "Create a job directly, or approve a quote to generate one automatically."
              }
              actionHref={hasFilter ? "/jobs" : user.role === "SUBCONTRACTOR" ? undefined : "/jobs/new"}
              actionLabel={hasFilter ? "Clear filters" : "+ New job"}
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                <tr>
                  <th className="px-5 py-2 font-medium">Job</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Trade</th>
                  <th className="px-5 py-2 font-medium">Area</th>
                  <th className="px-5 py-2 font-medium">Scheduled</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[#FAF7F1]">
                    <td className="px-5 py-3">
                      <Link href={`/jobs/${j.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                        {j.jobNumber} · {j.title}
                      </Link>
                      <p className="text-xs text-[#5B6B82]">{j.property.addressLine1}</p>
                    </td>
                    <td className="px-5 py-3 text-[#5B6B82]">{j.client.name}</td>
                    <td className="px-5 py-3">
                      <Badge className={tradeColors[j.trade]}>{tradeLabels[j.trade]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {j.property.serviceArea ? (
                        <Badge className={areaColor(j.property.serviceArea.name)}>
                          {j.property.serviceArea.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8A93A3]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#5B6B82]">
                      {j.scheduledStart ? format(j.scheduledStart, "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={jobStatusColors[j.status]}>{jobStatusLabels[j.status]}</Badge>
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
