import { requireUser } from "@/lib/session";
import { createClient } from "@/app/actions/clients";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function NewClientPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">New client</h1>

      <form action={createClient} className="space-y-6">
        <Card>
          <CardHeader title="Client" />
          <CardBody className="space-y-4">
            <FormField label="Client name" htmlFor="name" required>
              <Input id="name" name="name" required placeholder="e.g. Maple Ridge Property Management" />
            </FormField>
            <FormField label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="First property" subtitle="Optional — you can add more later" />
          <CardBody className="grid grid-cols-2 gap-4">
            <FormField label="Property label" htmlFor="propertyLabel">
              <Input id="propertyLabel" name="propertyLabel" placeholder="e.g. Main Building" />
            </FormField>
            <FormField label="City" htmlFor="city">
              <Input id="city" name="city" placeholder="Toronto" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Street address" htmlFor="addressLine1">
                <Input id="addressLine1" name="addressLine1" placeholder="123 Main St" />
              </FormField>
            </div>
            <FormField label="Postal code" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" placeholder="M5V 2T6" />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="First contact" subtitle="Optional — you can add more later" />
          <CardBody className="grid grid-cols-2 gap-4">
            <FormField label="First name" htmlFor="contactFirstName">
              <Input id="contactFirstName" name="contactFirstName" />
            </FormField>
            <FormField label="Last name" htmlFor="contactLastName">
              <Input id="contactLastName" name="contactLastName" />
            </FormField>
            <FormField label="Title / role" htmlFor="contactTitle" hint='e.g. "Property Manager", "Tenant", "AP Contact"'>
              <Input id="contactTitle" name="contactTitle" />
            </FormField>
            <FormField label="Email" htmlFor="contactEmail">
              <Input id="contactEmail" name="contactEmail" type="email" />
            </FormField>
            <FormField label="Phone" htmlFor="contactPhone">
              <Input id="contactPhone" name="contactPhone" type="tel" />
            </FormField>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit">Save client</Button>
        </div>
      </form>
    </div>
  );
}
