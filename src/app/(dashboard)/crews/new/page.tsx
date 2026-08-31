import { requireOfficeOrAdmin } from "@/lib/session";
import { createCrew } from "@/app/actions/crews";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function NewCrewPage() {
  await requireOfficeOrAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">New crew</h1>
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
              <div className="flex gap-4 text-sm text-gray-700">
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
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact email" htmlFor="contactEmail">
                <Input id="contactEmail" name="contactEmail" type="email" />
              </FormField>
              <FormField label="Contact phone" htmlFor="contactPhone">
                <Input id="contactPhone" name="contactPhone" type="tel" />
              </FormField>
            </div>
            <Button type="submit">Save crew</Button>
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
