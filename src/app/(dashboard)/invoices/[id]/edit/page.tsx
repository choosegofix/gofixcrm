import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { updateInvoice } from "@/app/actions/invoices";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { LineItemsEditor } from "@/components/quotes/LineItemsEditor";
import { PersonNameInput } from "@/components/ui/PersonNameInput";
import { format } from "date-fns";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOfficeOrAdmin();
  const { id } = await params;
  const company = await getCompany();

  const [invoice, users, contacts] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        billingContact: true,
        job: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.user.findMany({ where: { companyId: company.id, isActive: true }, select: { name: true } }),
    prisma.contact.findMany({ where: { companyId: company.id }, select: { firstName: true, lastName: true } }),
  ]);

  if (!invoice) notFound();
  if (invoice.status === "VOID" || Number(invoice.amountPaid) > 0) {
    redirect(`/invoices/${invoice.id}`);
  }

  const suggestionNames = [
    ...users.map((u) => u.name),
    ...contacts.map((c) => `${c.firstName} ${c.lastName}`.trim()),
  ];
  const billingContactName = invoice.billingContact
    ? `${invoice.billingContact.firstName} ${invoice.billingContact.lastName}`.trim()
    : "";

  const updateThisInvoice = updateInvoice.bind(null, invoice.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/invoices/${invoice.id}`} className="text-sm text-[#5B6B82] hover:text-[#D9480F]">
          ← Back to {invoice.invoiceNumber}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-[#16233A]">Edit invoice</h1>
        <p className="text-sm text-[#5B6B82]">
          {invoice.client.name}
          {invoice.job && ` — ${invoice.job.jobNumber} · ${invoice.job.title}`}
        </p>
      </div>

      <form action={updateThisInvoice} className="space-y-6">
        <Card>
          <CardHeader title="Invoice details" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Issue date" htmlFor="issueDate" required>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={format(invoice.issueDate, "yyyy-MM-dd")}
              />
            </FormField>
            <FormField label="Due date" htmlFor="dueDate" required>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                defaultValue={format(invoice.dueDate, "yyyy-MM-dd")}
              />
            </FormField>
            <FormField label="Discount" htmlFor="discountAmount" hint="Leave blank for no discount">
              <Input
                id="discountAmount"
                name="discountAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={Number(invoice.discountAmount) || undefined}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Billing contact"
            subtitle="Optional — leave blank to bill the client's usual contact"
          />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Name" htmlFor="billingContactName">
              <PersonNameInput
                id="billingContactName"
                name="billingContactName"
                existingNames={suggestionNames}
                placeholder="Type an existing or new contact"
                defaultValue={billingContactName}
              />
            </FormField>
            <FormField label="Email" htmlFor="billingContactEmail" hint="Only used if this is a new contact">
              <Input
                id="billingContactEmail"
                name="billingContactEmail"
                type="email"
                defaultValue={invoice.billingContact?.email ?? ""}
              />
            </FormField>
            <FormField label="Phone" htmlFor="billingContactPhone" hint="Only used if this is a new contact">
              <Input
                id="billingContactPhone"
                name="billingContactPhone"
                type="tel"
                defaultValue={invoice.billingContact?.phone ?? ""}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Line items" />
          <CardBody>
            <LineItemsEditor
              showOptional={false}
              initialItems={invoice.lineItems.map((li) => ({
                description: li.description,
                quantity: Number(li.quantity),
                unitPrice: Number(li.unitPrice),
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes" />
          <CardBody>
            <Textarea name="notes" rows={2} defaultValue={invoice.notes ?? ""} placeholder="Shown on the invoice, optional" />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href={`/invoices/${invoice.id}`} variant="secondary">Cancel</LinkButton>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
