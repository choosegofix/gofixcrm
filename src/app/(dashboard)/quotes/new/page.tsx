import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { createQuote } from "@/app/actions/quotes";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ClientPropertySelect } from "@/components/jobs/ClientPropertySelect";
import { LineItemsEditor } from "@/components/quotes/LineItemsEditor";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; clientId?: string }>;
}) {
  await requireUser();
  const company = await getCompany();
  const { leadId, clientId } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isArchived: false },
    orderBy: { name: "asc" },
    include: { properties: { orderBy: { createdAt: "asc" } } },
  });

  let defaultTitle = "";
  let defaultTrade = "HVAC";
  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      defaultTitle = lead.description.slice(0, 80);
      defaultTrade = lead.trade;
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">New quote</h1>
      <form action={createQuote} className="space-y-6">
        {leadId && <input type="hidden" name="leadId" value={leadId} />}

        <Card>
          <CardHeader title="Quote for" />
          <CardBody className="space-y-4">
            <ClientPropertySelect clients={clients} initialClientId={clientId} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quote title" htmlFor="title" required>
                <Input id="title" name="title" required defaultValue={defaultTitle} />
              </FormField>
              <FormField label="Trade" htmlFor="trade" required>
                <Select id="trade" name="trade" defaultValue={defaultTrade}>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                </Select>
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Line items" subtitle="Uncheck 'Optional' items are excluded from the total" />
          <CardBody>
            <LineItemsEditor />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Terms" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Deposit required" htmlFor="depositRequired" hint="Leave blank for no deposit">
                <Input id="depositRequired" name="depositRequired" type="number" step="0.01" min="0" />
              </FormField>
              <FormField label="Valid until" htmlFor="validUntil">
                <Input id="validUntil" name="validUntil" type="date" />
              </FormField>
            </div>
            <FormField label="Notes (internal)" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={2} />
            </FormField>
            <FormField label="Terms & conditions (shown to client)" htmlFor="termsAndConditions">
              <Textarea id="termsAndConditions" name="termsAndConditions" rows={3} />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save quote</Button>
        </div>
      </form>
    </div>
  );
}
