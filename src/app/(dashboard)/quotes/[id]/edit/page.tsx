import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOfficeOrAdmin } from "@/lib/session";
import { updateQuote } from "@/app/actions/quotes";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { LineItemsEditor } from "@/components/quotes/LineItemsEditor";
import { ClientPropertySelect } from "@/components/jobs/ClientPropertySelect";
import { getCompany } from "@/lib/company";
import { format } from "date-fns";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOfficeOrAdmin();
  const { id } = await params;
  const company = await getCompany();

  const [quote, clients] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { client: true, property: true, lineItems: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.client.findMany({
      where: { companyId: company.id, isArchived: false },
      orderBy: { name: "asc" },
      include: { properties: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  if (!quote) notFound();
  if (quote.status === "APPROVED" || quote.status === "DECLINED" || quote.status === "EXPIRED") {
    redirect(`/quotes/${quote.id}`);
  }

  const updateThisQuote = updateQuote.bind(null, quote.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/quotes/${quote.id}`} className="text-sm text-[#5B6B82] hover:text-[#D9480F]">
          ← Back to {quote.quoteNumber}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-[#16233A]">Edit quote</h1>
        <p className="text-sm text-[#5B6B82]">
          {quote.client.name} — {quote.property.addressLine1}
        </p>
      </div>

      <form action={updateThisQuote} className="space-y-6">
        <Card>
          <CardHeader title="Quote for" />
          <CardBody className="space-y-4">
            <ClientPropertySelect
              clients={clients}
              initialClientId={quote.clientId}
              initialPropertyId={quote.propertyId}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quote title" htmlFor="title" required>
                <Input id="title" name="title" required defaultValue={quote.title} />
              </FormField>
              <FormField label="Trade" htmlFor="trade" required>
                <Select id="trade" name="trade" defaultValue={quote.trade}>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                </Select>
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Line items" subtitle="Unchecked 'Optional' items are excluded from the total" />
          <CardBody>
            <LineItemsEditor
              initialItems={quote.lineItems.map((li) => ({
                description: li.description,
                quantity: Number(li.quantity),
                unitPrice: Number(li.unitPrice),
                isOptional: li.isOptional,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Terms" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Deposit required" htmlFor="depositRequired" hint="Leave blank for no deposit">
                <Input
                  id="depositRequired"
                  name="depositRequired"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={quote.depositRequired ? Number(quote.depositRequired) : undefined}
                />
              </FormField>
              <FormField label="Valid until" htmlFor="validUntil">
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                  defaultValue={quote.validUntil ? format(quote.validUntil, "yyyy-MM-dd") : undefined}
                />
              </FormField>
            </div>
            <FormField label="Notes (internal)" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={2} defaultValue={quote.notes ?? ""} />
            </FormField>
            <FormField label="Terms & conditions (shown to client)" htmlFor="termsAndConditions">
              <Textarea
                id="termsAndConditions"
                name="termsAndConditions"
                rows={3}
                defaultValue={quote.termsAndConditions ?? ""}
              />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href={`/quotes/${quote.id}`} variant="secondary">Cancel</LinkButton>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
