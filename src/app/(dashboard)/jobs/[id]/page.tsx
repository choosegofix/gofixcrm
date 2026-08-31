import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { assignToJob } from "@/app/actions/jobs";
import { createVisit } from "@/app/actions/visits";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
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
import { LinkButton } from "@/components/ui/Button";
import { invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import Link from "next/link";
import { format } from "date-fns";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const company = await getCompany();

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      property: true,
      quote: true,
      visits: { orderBy: { scheduledStart: "asc" } },
      assignments: { include: { user: true, crew: true } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!job) notFound();

  const [users, crews] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id, isActive: true, role: { in: ["FIELD", "SUBCONTRACTOR", "OFFICE"] } },
      orderBy: { name: "asc" },
    }),
    prisma.crew.findMany({ where: { companyId: company.id, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const createVisitForJob = createVisit.bind(null, job.id);
  const assignToThisJob = assignToJob.bind(null, job.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{job.jobNumber}</p>
          <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
          <p className="text-sm text-gray-500">
            {job.client.name} — {job.property.addressLine1}
          </p>
        </div>
        <JobStatusSelect jobId={job.id} status={job.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={tradeColors[job.trade]}>{tradeLabels[job.trade]}</Badge>
        <Badge className="border-gray-200 bg-gray-100 text-gray-700">
          {pricingResponsibilityLabels[job.pricingResponsibility]}
        </Badge>
        {job.quote && (
          <Link href={`/quotes/${job.quote.id}`} className="text-xs font-medium text-blue-600 hover:underline">
            From quote {job.quote.quoteNumber} →
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {job.description && (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{job.description}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Visits" subtitle="Individual scheduled instances of this job" />
            <CardBody className="space-y-4">
              {job.visits.length > 0 && (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                  {job.visits.map((v) => (
                    <li key={v.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">Visit #{v.visitNumber}</p>
                        <p className="text-gray-500">
                          {format(v.scheduledStart, "EEE, MMM d · h:mm a")} – {format(v.scheduledEnd, "h:mm a")}
                        </p>
                        {v.notes && <p className="mt-1 text-xs text-gray-400">{v.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={visitStatusColors[v.status]}>{visitStatusLabels[v.status]}</Badge>
                        <VisitStatusSelect jobId={job.id} visitId={v.id} status={v.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-600">+ Schedule a visit</summary>
                <form action={createVisitForJob} className="mt-3 grid grid-cols-2 gap-3">
                  <FormField label="Start" htmlFor="scheduledStart" required>
                    <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
                  </FormField>
                  <FormField label="End" htmlFor="scheduledEnd" required>
                    <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
                  </FormField>
                  <div className="col-span-2">
                    <FormField label="Notes" htmlFor="visitNotes">
                      <Textarea id="visitNotes" name="notes" rows={2} />
                    </FormField>
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" size="sm">Add visit</Button>
                  </div>
                </form>
              </details>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Invoices"
              action={<LinkButton href={`/invoices/new?jobId=${job.id}`} size="sm">+ New invoice</LinkButton>}
            />
            <CardBody className="p-0">
              {job.invoices.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-500">No invoices yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {job.invoices.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {inv.invoiceNumber}
                      </Link>
                      <span className="text-gray-500">
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
              <p className="text-sm text-gray-500">
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
                    <li key={a.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{a.user?.name ?? a.crew?.name}</p>
                        {a.role && <p className="text-xs text-gray-500">{a.role}</p>}
                      </div>
                      <RemoveAssignmentButton jobId={job.id} assignmentId={a.id} />
                    </li>
                  ))}
                </ul>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-600">+ Assign crew or person</summary>
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
                  <FormField label="Or a crew" htmlFor="crewId">
                    <Select id="crewId" name="crewId" defaultValue="">
                      <option value="">— none —</option>
                      {crews.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Role" htmlFor="role" hint="e.g. Lead, Helper">
                    <Input id="role" name="role" />
                  </FormField>
                  <Button type="submit" size="sm">Assign</Button>
                </form>
              </details>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
