import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { createLead } from "@/app/actions/leads";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ClientPropertySelect } from "@/components/jobs/ClientPropertySelect";

export default async function NewLeadPage() {
  await requireUser();
  const company = await getCompany();

  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isArchived: false },
    orderBy: { name: "asc" },
    include: { properties: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">New lead</h1>
      <form action={createLead} className="space-y-6">
        <Card>
          <CardHeader title="Who's asking" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact name" htmlFor="contactName" required>
                <Input id="contactName" name="contactName" required />
              </FormField>
              <FormField label="Source" htmlFor="source" hint="Phone, website form, referral...">
                <Input id="source" name="source" />
              </FormField>
              <FormField label="Email" htmlFor="contactEmail">
                <Input id="contactEmail" name="contactEmail" type="email" />
              </FormField>
              <FormField label="Phone" htmlFor="contactPhone">
                <Input id="contactPhone" name="contactPhone" type="tel" />
              </FormField>
            </div>
            <ClientPropertySelect clients={clients} clientOptional />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="What they need" />
          <CardBody className="space-y-4">
            <FormField label="Trade" htmlFor="trade" required>
              <Select id="trade" name="trade" defaultValue="HVAC">
                <option value="HVAC">HVAC</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
              </Select>
            </FormField>
            <FormField label="Description" htmlFor="description" required>
              <Textarea id="description" name="description" rows={3} required />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save lead</Button>
        </div>
      </form>
    </div>
  );
}
