import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import Link from "next/link";
import { addCrewMember, updateCrewNotes } from "@/app/actions/crews";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { crewTypeLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { areaColor } from "@/lib/serviceArea";
import { PersonNameInput } from "@/components/ui/PersonNameInput";

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOfficeOrAdmin();
  const { id } = await params;
  const company = await getCompany();

  const crew = await prisma.crew.findUnique({
    where: { id },
    include: {
      members: { include: { user: { include: { contact: true } }, contact: true } },
      jobAssignments: { include: { job: { include: { client: true } } } },
      serviceAreas: { include: { serviceArea: true } },
    },
  });

  if (!crew) notFound();

  const memberUserIds = new Set(crew.members.map((m) => m.userId).filter((id): id is string => !!id));
  const memberContactIds = new Set(crew.members.map((m) => m.contactId).filter((id): id is string => !!id));
  const [availableUsers, availableContacts] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id, isActive: true, id: { notIn: [...memberUserIds] } },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { companyId: company.id, userId: null, id: { notIn: [...memberContactIds] } },
      orderBy: { firstName: "asc" },
    }),
  ]);
  const suggestionNames = [
    ...availableUsers.map((u) => u.name),
    ...availableContacts.map((c) => `${c.firstName} ${c.lastName}`.trim()),
  ];

  const addMemberToCrew = addCrewMember.bind(null, crew.id);
  const updateNotesForCrew = updateCrewNotes.bind(null, crew.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#16233A]">{crew.name}</h1>
        <p className="text-sm text-[#5B6B82]">{crewTypeLabels[crew.type]}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {crew.trades.map((t) => (
            <Badge key={t} className={tradeColors[t]}>
              {tradeLabels[t]}
            </Badge>
          ))}
          {crew.serviceAreas.map((sa) => (
            <Badge key={sa.serviceAreaId} className={areaColor(sa.serviceArea.name)}>
              {sa.serviceArea.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Members" />
          <CardBody className="space-y-4">
            {crew.members.length > 0 && (
              <ul className="space-y-2">
                {crew.members.map((m) => {
                  const contact = m.user?.contact ?? m.contact;
                  const name = m.user?.name ?? (m.contact ? `${m.contact.firstName} ${m.contact.lastName}` : "Unknown");
                  const email = m.user?.email ?? m.contact?.email;
                  return (
                    <li key={m.id} className="flex items-center justify-between rounded-md border border-[#EFEAE0] px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-[#16233A]">{name}</p>
                        <p className="text-xs text-[#5B6B82]">{email ?? "No CRM login"}</p>
                      </div>
                      {contact && (
                        <Link href={`/contacts/${contact.id}`} className="text-xs font-medium text-[#D9480F] hover:underline">
                          Contact card →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <form action={addMemberToCrew} className="flex items-end gap-2">
              <div className="flex-1">
                <FormField
                  label="Add a team member"
                  htmlFor="memberName"
                  hint="Type an existing staff member's name to link their account, or a new name to add them without a CRM login."
                >
                  <PersonNameInput
                    id="memberName"
                    name="memberName"
                    existingNames={suggestionNames}
                    required
                  />
                </FormField>
              </div>
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assigned jobs" />
          <CardBody className="p-0">
            {crew.jobAssignments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#5B6B82]">No jobs assigned yet.</p>
            ) : (
              <ul className="divide-y divide-[#EFEAE0]">
                {crew.jobAssignments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/jobs/${a.job.id}`}
                      className="block px-5 py-3 text-sm transition hover:bg-[#FAF7F1]"
                    >
                      <p className="font-medium text-[#16233A] hover:text-[#D9480F]">{a.job.title}</p>
                      <p className="text-xs text-[#5B6B82]">{a.job.client.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Notes" subtitle="Internal — reliability, preferences, anything worth remembering" />
          <CardBody>
            <form action={updateNotesForCrew} className="space-y-2">
              <Textarea
                name="notes"
                rows={5}
                defaultValue={crew.notes ?? ""}
                placeholder="e.g. Great with commercial HVAC, prefers morning starts, license expires March 2027…"
              />
              <Button type="submit" size="sm">Save notes</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
