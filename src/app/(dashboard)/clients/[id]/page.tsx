import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addContact, addProperty } from "@/app/actions/clients";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { jobStatusColors, jobStatusLabels } from "@/lib/labels";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      properties: { orderBy: { createdAt: "asc" } },
      jobs: { orderBy: { createdAt: "desc" }, include: { property: true } },
    },
  });

  if (!client) notFound();

  const addContactWithClient = addContact.bind(null, client.id);
  const addPropertyWithClient = addProperty.bind(null, client.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {client.properties.length} propert{client.properties.length === 1 ? "y" : "ies"} ·{" "}
            {client.jobs.length} job{client.jobs.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/quotes/new?clientId=${client.id}`} variant="secondary">
            + New quote
          </LinkButton>
          <LinkButton href={`/jobs/new?clientId=${client.id}`}>+ New job</LinkButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Jobs" />
            <CardBody className="p-0">
              {client.jobs.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-500">No jobs for this client yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {client.jobs.map((j) => (
                    <li key={j.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <Link href={`/jobs/${j.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {j.jobNumber} · {j.title}
                        </Link>
                        <p className="text-xs text-gray-500">{j.property.addressLine1}</p>
                      </div>
                      <Badge className={jobStatusColors[j.status]}>{jobStatusLabels[j.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Properties" />
            <CardBody className="space-y-4">
              {client.properties.length > 0 && (
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                  {client.properties.map((p) => (
                    <li key={p.id} className="px-4 py-3 text-sm">
                      <p className="font-medium text-gray-900">{p.label || p.addressLine1}</p>
                      <p className="text-gray-500">
                        {p.addressLine1}
                        {p.addressLine2 ? `, ${p.addressLine2}` : ""}, {p.city}
                        {p.postalCode ? ` ${p.postalCode}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-600">+ Add a property</summary>
                <form action={addPropertyWithClient} className="mt-3 grid grid-cols-2 gap-3">
                  <FormField label="Label" htmlFor="label">
                    <Input id="label" name="label" placeholder="e.g. Building A" />
                  </FormField>
                  <FormField label="City" htmlFor="propCity">
                    <Input id="propCity" name="city" defaultValue="Toronto" />
                  </FormField>
                  <div className="col-span-2">
                    <FormField label="Street address" htmlFor="addressLine1" required>
                      <Input id="addressLine1" name="addressLine1" required />
                    </FormField>
                  </div>
                  <FormField label="Postal code" htmlFor="postalCode">
                    <Input id="postalCode" name="postalCode" />
                  </FormField>
                  <FormField label="Access notes" htmlFor="accessNotes">
                    <Input id="accessNotes" name="accessNotes" placeholder="Gate code, parking, etc." />
                  </FormField>
                  <div className="col-span-2">
                    <Button type="submit" size="sm">Add property</Button>
                  </div>
                </form>
              </details>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contacts" />
            <CardBody className="space-y-4">
              {client.contacts.length > 0 && (
                <ul className="space-y-3">
                  {client.contacts.map((c) => (
                    <li key={c.id} className="rounded-md border border-gray-100 p-3 text-sm">
                      <p className="font-medium text-gray-900">
                        {c.firstName} {c.lastName}
                        {c.isPrimary && <span className="ml-2 text-xs font-normal text-blue-600">Primary</span>}
                      </p>
                      {c.title && <p className="text-xs text-gray-500">{c.title}</p>}
                      {c.email && <p className="text-gray-600">{c.email}</p>}
                      {c.phone && <p className="text-gray-600">{c.phone}</p>}
                      <p className="mt-1 text-xs text-gray-400">Prefers {c.commPreference.toLowerCase()}</p>
                    </li>
                  ))}
                </ul>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-600">+ Add a contact</summary>
                <form action={addContactWithClient} className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="First name" htmlFor="firstName" required>
                      <Input id="firstName" name="firstName" required />
                    </FormField>
                    <FormField label="Last name" htmlFor="lastName">
                      <Input id="lastName" name="lastName" />
                    </FormField>
                  </div>
                  <FormField label="Title / role" htmlFor="title">
                    <Input id="title" name="title" placeholder="Property Manager, Tenant, AP Contact..." />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Email" htmlFor="cEmail">
                      <Input id="cEmail" name="email" type="email" />
                    </FormField>
                    <FormField label="Phone" htmlFor="cPhone">
                      <Input id="cPhone" name="phone" type="tel" />
                    </FormField>
                  </div>
                  <FormField label="Preferred contact method" htmlFor="commPreference">
                    <Select id="commPreference" name="commPreference" defaultValue="EMAIL">
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="PHONE">Phone</option>
                      <option value="ANY">Any</option>
                    </Select>
                  </FormField>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="isPrimary" /> Primary contact
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" name="isBilling" /> Billing contact
                    </label>
                  </div>
                  <Button type="submit" size="sm">Add contact</Button>
                </form>
              </details>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <CardBody>
              <Textarea defaultValue={client.notes ?? ""} rows={4} readOnly className="bg-gray-50" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
