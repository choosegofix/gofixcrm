import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { createInvoice } from "@/app/actions/invoices";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor } from "@/components/quotes/LineItemsEditor";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  await requireUser();
  const company = await getCompany();
  const { jobId } = await searchParams;

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">New invoice</h1>
      <form action={createInvoice} className="space-y-6">
        <Card>
          <CardHeader title="Invoice for" />
          <CardBody className="space-y-4">
            <FormField label="Job" htmlFor="jobId" required>
              <Select id="jobId" name="jobId" required defaultValue={jobId ?? ""}>
                <option value="" disabled>
                  Select a job
                </option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.jobNumber} · {j.title} — {j.client.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Due date" htmlFor="dueDate" required>
              <Input id="dueDate" name="dueDate" type="date" required />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Line items" subtitle="For progress billing, create a separate invoice per stage" />
          <CardBody>
            <LineItemsEditor showOptional={false} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes" />
          <CardBody>
            <Textarea name="notes" rows={2} placeholder="Shown on the invoice, optional" />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Create invoice</Button>
        </div>
      </form>
    </div>
  );
}
