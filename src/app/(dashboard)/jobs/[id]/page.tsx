import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { assignToJob, updateJobNotes, updateJobDescription } from "@/app/actions/jobs";
import { createVisit } from "@/app/actions/visits";
import { createTask, applyTemplateToJob } from "@/app/actions/tasks";
import { addTagToJob, removeTagFromJob } from "@/app/actions/tags";
import { createJobComment } from "@/app/actions/comments";
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
import { ScheduleVisitButton } from "@/components/jobs/ScheduleVisitButton";
import { TaskCheckbox } from "@/components/jobs/TaskCheckbox";
import { CommentComposer, type Mentionable } from "@/components/jobs/CommentComposer";
import { LinkButton } from "@/components/ui/Button";
import { invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { TicketHeader } from "@/components/ui/TicketHeader";
import { hasJobAccess } from "@/lib/jobAccess";
import { areaColor } from "@/lib/serviceArea";
import { DirectionsLinks } from "@/components/ui/DirectionsLinks";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

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
      tasks: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });

  if (!job) notFound();
  if (user.role === "SUBCONTRACTOR" && !(await hasJobAccess(user.id, job.id))) notFound();

  const [users, crewsRaw, allTags, templates] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id, isActive: true, role: { in: ["FIELD", "SUBCONTRACTOR", "OFFICE"] } },
      orderBy: { name: "asc" },
    }),
    prisma.crew.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { name: "asc" },
      include: { serviceAreas: true },
    }),
    prisma.tag.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" } }),
    prisma.taskTemplate.findMany({
      where: { companyId: company.id, OR: [{ trade: job.trade }, { trade: null }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const mentionables: Mentionable[] = [
    ...users.map((u) => ({ id: u.id, type: "user" as const, name: u.name })),
    ...crewsRaw.map((c) => ({ id: c.id, type: "crew" as const, name: c.name })),
  ];
  const jobTagIds = new Set(job.tags.map((t) => t.tagId));
  const availableTags = allTags.filter((t) => !jobTagIds.has(t.id));

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
  const createTaskForJob = createTask.bind(null, job.id);
  const applyTemplateForJob = applyTemplateToJob.bind(null, job.id);
  const addTagForJob = addTagToJob.bind(null, job.id);
  const createCommentForJob = createJobComment.bind(null, job.id);
  const updateNotesForJob = updateJobNotes.bind(null, job.id);
  const updateDescriptionForJob = updateJobDescription.bind(null, job.id);

  const openTasks = job.tasks.filter((t) => t.status === "OPEN");
  const completedTasks = job.tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <TicketHeader
        kind="Job ticket"
        number={job.jobNumber}
        title={job.title}
        meta={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {job.client.name} — {job.property.addressLine1}
            </span>
            <DirectionsLinks
              address={`${job.property.addressLine1}, ${job.property.city}, ${job.property.province}`}
              lat={job.property.lat}
              lng={job.property.lng}
            />
          </span>
        }
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

      <Card>
        <CardHeader title="Assigned to" />
        <CardBody className="space-y-3">
          {job.assignments.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {job.assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-full border border-[#EFEAE0] bg-[#FAF7F1] py-1.5 pl-3 pr-2 text-sm"
                >
                  <span className="font-medium text-[#16233A]">{a.user?.name ?? a.crew?.name}</span>
                  {a.role && <span className="text-xs text-[#5B6B82]">· {a.role}</span>}
                  {user.role !== "SUBCONTRACTOR" && (
                    <RemoveAssignmentButton jobId={job.id} assignmentId={a.id} />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#8A93A3]">Nobody assigned yet.</p>
          )}
          {user.role !== "SUBCONTRACTOR" && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-[#D9480F]">+ Assign crew or person</summary>
              <form action={assignToThisJob} className="mt-3 grid gap-3 sm:grid-cols-3">
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
                <div className="sm:col-span-3">
                  <Button type="submit" size="sm">Assign</Button>
                </div>
              </form>
            </details>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-1.5">
        {job.tags.map((t) => (
          <span
            key={t.tagId}
            className="group inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${t.tag.color}1a`,
              borderColor: `${t.tag.color}55`,
              color: t.tag.color,
            }}
          >
            {t.tag.name}
            <form action={removeTagFromJob.bind(null, job.id, t.tagId)}>
              <button type="submit" className="opacity-60 hover:opacity-100" aria-label={`Remove ${t.tag.name}`}>
                ✕
              </button>
            </form>
          </span>
        ))}
        <details className="text-xs">
          <summary className="cursor-pointer rounded-full border border-dashed border-[#DDD6C7] px-2.5 py-0.5 font-medium text-[#5B6B82] hover:border-[#D9480F] hover:text-[#D9480F]">
            + Tag
          </summary>
          <form action={addTagForJob} className="mt-2 flex items-center gap-2 rounded-md border border-[#E3DDD0] bg-white p-2 shadow-sm">
            {availableTags.length > 0 && (
              <Select
                name="tagId"
                className="flex items-center justify-between gap-2 rounded border border-[#DDD6C7] bg-white px-2 py-1 text-xs"
                defaultValue=""
              >
                <option value="">— pick existing —</option>
                {availableTags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
            <input
              type="text"
              name="newTagName"
              placeholder="or type a new tag"
              className="w-32 rounded border border-[#DDD6C7] px-2 py-1 text-xs"
            />
            <button type="submit" className="rounded bg-[#D9480F] px-2 py-1 text-xs font-medium text-white">
              Add
            </button>
          </form>
        </details>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              {user.role === "SUBCONTRACTOR" ? (
                <p className="whitespace-pre-wrap text-sm text-[#3A4A5F]">
                  {job.description || <span className="text-[#8A93A3]">No description yet.</span>}
                </p>
              ) : (
                <form action={updateDescriptionForJob} className="space-y-2">
                  <Textarea
                    name="description"
                    rows={4}
                    defaultValue={job.description ?? ""}
                    placeholder="What's the job? Symptoms, scope, anything the crew needs to know before arriving…"
                  />
                  <Button type="submit" size="sm">Save description</Button>
                </form>
              )}
            </CardBody>
          </Card>

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
              title="Checklist"
              subtitle={`${completedTasks.length} of ${job.tasks.length} done`}
              action={
                templates.length > 0 ? (
                  <form action={applyTemplateForJob} className="flex items-center gap-2">
                    <Select
                      name="templateId"
                      className="flex items-center justify-between gap-2 rounded-md border border-[#DDD6C7] bg-white px-2 py-1 text-xs text-[#16233A]"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Apply a template…
                      </option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                    <button type="submit" className="text-xs font-medium text-[#D9480F] hover:underline">
                      Apply
                    </button>
                  </form>
                ) : undefined
              }
            />
            <CardBody className="space-y-3">
              {job.tasks.length > 0 && (
                <ul className="space-y-1.5">
                  {[...openTasks, ...completedTasks].map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-md border border-[#EFEAE0] px-3 py-2 text-sm">
                      <TaskCheckbox jobId={job.id} taskId={t.id} completed={t.status === "COMPLETED"} />
                      <span
                        className={t.status === "COMPLETED" ? "flex-1 text-[#8A93A3] line-through" : "flex-1 text-[#16233A]"}
                      >
                        {t.title}
                      </span>
                      {t.requiresPhoto && (
                        <span className="text-xs text-[#8A5A19]" title="Photo required">
                          📷
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form action={createTaskForJob} className="flex items-center gap-2">
                <input
                  type="text"
                  name="title"
                  placeholder="Add a task…"
                  required
                  className="flex-1 rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F]"
                />
                <label className="flex items-center gap-1 text-xs text-[#5B6B82]">
                  <input type="checkbox" name="requiresPhoto" /> Photo
                </label>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
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
            <CardHeader title="Job notes" subtitle="Internal — not visible to clients" />
            <CardBody>
              {user.role === "SUBCONTRACTOR" ? (
                <p className="whitespace-pre-wrap text-sm text-[#3A4A5F]">
                  {job.notes || <span className="text-[#8A93A3]">No notes yet.</span>}
                </p>
              ) : (
                <form action={updateNotesForJob} className="space-y-2">
                  <Textarea
                    name="notes"
                    rows={6}
                    defaultValue={job.notes ?? ""}
                    placeholder="Gate codes, parking instructions, anything the crew or office should know…"
                  />
                  <Button type="submit" size="sm">Save notes</Button>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Comments" subtitle="@mention a person or a whole crew to notify them" />
        <CardBody className="space-y-4">
          {job.comments.length > 0 && (
            <ul className="space-y-3">
              {job.comments.map((c) => (
                <li key={c.id} className="rounded-md border border-[#EFEAE0] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#16233A]">{c.author.name}</p>
                    <p className="text-xs text-[#8A93A3]">{formatDistanceToNow(c.createdAt, { addSuffix: true })}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#3A4A5F]">
                    {c.body.split(/(@[\w]+(?:\s[\w]+)?)/g).map((part, i) =>
                      part.startsWith("@") ? (
                        <span key={i} className="font-medium text-[#D9480F]">
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <CommentComposer action={createCommentForJob} mentionables={mentionables} />
        </CardBody>
      </Card>
    </div>
  );
}
