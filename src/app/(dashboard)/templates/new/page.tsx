import { requireOfficeOrAdmin } from "@/lib/session";
import { createTaskTemplate } from "@/app/actions/templates";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ChecklistItemsEditor } from "@/components/jobs/ChecklistItemsEditor";

export default async function NewTemplatePage() {
  await requireOfficeOrAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-[#16233A]">New checklist template</h1>
      <form action={createTaskTemplate} className="space-y-6">
        <Card>
          <CardHeader title="Template" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" htmlFor="name" required>
                <Input id="name" name="name" required placeholder="e.g. Standard HVAC Install" />
              </FormField>
              <FormField label="Trade" htmlFor="trade" hint="Optional — leave blank if it applies to any trade">
                <Select id="trade" name="trade" defaultValue="">
                  <option value="">Any trade</option>
                  <option value="HVAC">HVAC</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                </Select>
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tasks" />
          <CardBody>
            <ChecklistItemsEditor />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save template</Button>
        </div>
      </form>
    </div>
  );
}
