import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { createCrew } from "@/app/actions/crews";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CrewMembersEditor } from "@/components/crews/CrewMembersEditor";

export default async function NewCrewPage() {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const [areas, users] = await Promise.all([
    prisma.serviceArea.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-[#16233A]">New crew</h1>
      <form action={createCrew}>
        <Card>
          <CardHeader title="Crew" />
          <CardBody className="space-y-4">
            <FormField label="Name" htmlFor="name" required>
              <Input id="name" name="name" required placeholder="e.g. Crew 2 — Dave & Mo" />
            </FormField>
            <FormField label="Type" htmlFor="type" required>
              <Select id="type" name="type" defaultValue="INTERNAL">
                <option value="INTERNAL">Internal crew</option>
                <option value="SUBCONTRACTOR">Subcontractor</option>
              </Select>
            </FormField>
            <FormField label="Trades" htmlFor="trades">
              <div className="flex gap-4 text-sm text-[#3A4A5F]">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="trades" value="HVAC" /> HVAC
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="trades" value="ELECTRICAL" /> Electrical
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="trades" value="PLUMBING" /> Plumbing
                </label>
              </div>
            </FormField>
            <FormField
              label="Areas of operation"
              htmlFor="serviceAreaIds"
              required
              hint="Jobs in these areas will surface this crew first when dispatching."
            >
              {areas.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 rounded-md border border-[#E3DDD0] p-3 text-sm text-[#3A4A5F]">
                  {areas.map((a) => (
                    <label key={a.id} className="flex items-center gap-1.5">
                      <input type="checkbox" name="serviceAreaIds" value={a.id} />
                      {a.name}
                    </label>
                  ))}
                </div>
              )}
              <Input
                name="newServiceAreas"
                placeholder="Add new area(s), comma-separated — e.g. Scarborough, Markham"
                className="mt-2"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact email" htmlFor="contactEmail">
                <Input id="contactEmail" name="contactEmail" type="email" />
              </FormField>
              <FormField label="Contact phone" htmlFor="contactPhone">
                <Input id="contactPhone" name="contactPhone" type="tel" />
              </FormField>
            </div>
            <FormField label="Notes" htmlFor="notes" hint="Reliability, preferences, anything worth remembering — internal only">
              <Textarea id="notes" name="notes" rows={3} />
            </FormField>
            <FormField
              label="Members"
              htmlFor="member_0"
              hint="Type an existing staff member's name to link their account, or a new name to add them without a CRM login."
            >
              <CrewMembersEditor existingUserNames={users.map((u) => u.name)} />
            </FormField>
            <Button type="submit">Save crew</Button>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
