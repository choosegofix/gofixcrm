import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { addCrewMember } from "@/app/actions/crews";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { crewTypeLabels, tradeColors, tradeLabels } from "@/lib/labels";

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const company = await getCompany();

  const crew = await prisma.crew.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      jobAssignments: { include: { job: { include: { client: true } } } },
    },
  });

  if (!crew) notFound();

  const memberIds = new Set(crew.members.map((m) => m.userId));
  const availableUsers = await prisma.user.findMany({
    where: { companyId: company.id, isActive: true, id: { notIn: [...memberIds] } },
    orderBy: { name: "asc" },
  });

  const addMemberToCrew = addCrewMember.bind(null, crew.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{crew.name}</h1>
        <p className="text-sm text-gray-500">{crewTypeLabels[crew.type]}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {crew.trades.map((t) => (
            <Badge key={t} className={tradeColors[t]}>
              {tradeLabels[t]}
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
                {crew.members.map((m) => (
                  <li key={m.id} className="rounded-md border border-gray-100 px-3 py-2 text-sm">
                    <p className="font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </li>
                ))}
              </ul>
            )}
            {availableUsers.length > 0 && (
              <form action={addMemberToCrew} className="flex items-end gap-2">
                <div className="flex-1">
                  <FormField label="Add a team member" htmlFor="userId">
                    <Select id="userId" name="userId" required>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assigned jobs" />
          <CardBody className="p-0">
            {crew.jobAssignments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">No jobs assigned yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {crew.jobAssignments.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="font-medium text-gray-900">{a.job.title}</p>
                    <p className="text-xs text-gray-500">{a.job.client.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
