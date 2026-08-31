import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { assignToJob } from "@/app/actions/jobs";
import { createVisit } from "@/app/actions/visits";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  pricingResponsibilityLabels,
  tradeColors,
  tradeLabels,
  visitStatusColors,
  visitStatusLabels,
} from "@/lib/labels";
import { JobStatusSelect, VisitStatusSelect, RemoveAssignmentButton } from "@/components/jobs/StatusControls";
import { ScheduleVisitButton } from "@/components/jobs/ScheduleVisitButton";
import { LinkButton } from "@/components/ui/Button";
import { invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { TicketHeader } from "@/components/ui/TicketHeader";
import { hasJobAccess } from "@/lib/jobAccess";
import { areaColor } from "@/lib/serviceArea";
import Link from "next/link";
import { format } from "date-fns";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const company = await getCompany();

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      property: { include: { serviceArea: true } },
      quote: true,
      visits: { orderBy: { scheduledStart: "asc" } },
      assignments: { include: { user: true, crew: true } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!job) notFound();
  if (user.role === "SUBCONTRACTOR" && !(await hasJobAccess(user.id, job.id))) notFound();

  const [users, crewsRaw] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id, isActive: true, role: { in: ["FIELD", "SUBCONTRACTOR", "OFFICE"] } },
      orderBy: { name: "asc" },
    }),
    prisma.crew.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { name: "asc" },
      include: { serviceAreas: true },
    }),
  ]);

  // Crews covering this job's area are surfaced first, so dispatching to a
  // local crew is the path of least resistance.
  const crews = [...crewsRaw].sort((a, b) => {
    const aLocal = job.property.serviceAreaId
      ? a.serviceAreas.some((sa) => sa.serviceAreaId === job.property.serviceAreaId)
      : false;
    const bLocal = job.property.serviceAreaId
      ? b.serviceAreas.some((sa) => sa.serviceAreaId === job.property.serviceAreaId)
      : false;
    return aLocal === bLocal ? 0 : aLocal ? -1 : 1;
  });

  const createVisitForJob = createVisit.bind(null, job.id);
  const assignToThisJob = assignToJob.bind(null, job.id);

  return (
    <div className="space-y-6">
      <TicketHeader
        kind="Job ticket"
        number={job.jobNumber}
        title={job.title}
        meta={`${job.client.name} — ${job.property.addressLine1}`}
        status={<JobStatusSelect jobId={job.id} status={job.status} />}
        action={
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge className={tradeColors[job.trade]}>{tradeLabels[job.trade]}</Badge>
            {job.property.serviceArea && (
              <Badge className={areaColor(job.property.serviceArea.name)}>
                {job.property.serviceArea.name}
              </Badge>
            )}
            <Badge className="border-[#DDD6C7] bg-[#EEEAE1] text-[#5B6B82]">
              {pricingResponsibilityLabels[job.pricingResponsibility]}
            </Badge>
          </div>
        }
      />
      {job.quote && (
        <Link
          href={`/quotes/${job.quote.id}`}
          className="-mt-4 inline-block text-xs font-medium text-[#D9480F] hover:underline"
        >
          From quote {job.quote.quoteNumber} →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {job.description && (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-[#3A4A5F]">{job.description}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Visits" subtitle="Individual scheduled instances of this job" />
            <CardBody className="space-y-4">
              {job.visits.length > 0 && (
                <ul className="divide-y divide-[#EFEAE0] rounded-md border border-[#EFEAE0]">
                  {job.visits.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-[#16233A]">Visit #{v.visitNumber}</p>
                        <p className="text-[#5B6B82]">
                          {format(v.scheduledStart, "EEE, MMM d · h:mm a")} – {format(v.scheduledEnd, "h:mm a")}
                        </p>
                        {v.notes && <p className="mt-1 text-xs text-[#8A93A3]">{v.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={visitStatusColors[v.status]}>{visitStatusLabels[v.status]}</Badge>
                        <VisitStatusSelect jobId={job.id} visitId={v.id} status={v.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <ScheduleVisitButton action={createVisitForJob} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Invoices"
              action={<LinkButton href={`/invoices/new?jobId=${job.id}`} size="sm">+ New invoice</LinkButton>}
            />
            <CardBody className="p-0">
              {job.invoices.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[#5B6B82]">No invoices yet.</p>
              ) : (
                <ul className="divide-y divide-[#EFEAE0]">
                  {job.invoices.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                        {inv.invoiceNumber}
                      </Link>
                      <span className="text-[#5B6B82]">
                        {formatCurrency(inv.total)} · {invoiceStatusLabels[inv.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Photos & documentation" subtitle="Coming in the next build phase" />
            <CardBody>
              <p className="text-sm text-[#5B6B82]">
                Job-site photo capture with GPS/timestamp tagging and the project timeline will live here.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Assigned to" />
            <CardBody className="space-y-4">
              {job.assignments.length > 0 && (
                <ul className="space-y-2">
                  {job.assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-md border border-[#EFEAE0] px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-[#16233A]">{a.user?.name ?? a.crew?.name}</p>
                        {a.role && <p className="text-xs text-[#5B6B82]">{a.role}</p>}
                      </div>
                      {user.role !== "SUBCONTRACTOR" && (
                        <RemoveAssignmentButton jobId={job.id} assignmentId={a.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {user.role !== "SUBCONTRACTOR" && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-[#D9480F]">+ Assign crew or person</summary>
                  <form action={assignToThisJob} className="mt-3 space-y-3">
                    <FormField label="Team member" htmlFor="userId">
                      <Select id="userId" name="userId" defaultValue="">
                        <option value="">— none —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField
                      label="Or a crew"
                      htmlFor="crewId"
                      hint={job.property.serviceArea ? "Local crews for this area are listed first" : undefined}
                    >
                      <Select id="crewId" name="crewId" defaultValue="">
                        <option value="">— none —</option>
                        {crews.map((c) => {
                          const isLocal = job.property.serviceAreaId
                            ? c.serviceAreas.some((sa) => sa.serviceAreaId === job.property.serviceAreaId)
                            : false;
                          return (
                            <option key={c.id} value={c.id}>
                              {isLocal ? `📍 ${c.name} — local` : c.name}
                            </option>
                          );
                        })}
                      </Select>
                    </FormField>
                    <FormField label="Role" htmlFor="role" hint="e.g. Lead, Helper">
                      <Input id="role" name="role" />
                    </FormField>
                    <Button type="submit" size="sm">Assign</Button>
                  </form>
                </details>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
