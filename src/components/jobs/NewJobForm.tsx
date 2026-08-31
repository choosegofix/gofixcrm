"use client";

import { useState } from "react";
import Link from "next/link";
import { createJob } from "@/app/actions/jobs";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Client, Property } from "@prisma/client";

type ClientWithProperties = Client & { properties: Property[] };

const NEW_CLIENT = "__new__";
const NEW_PROPERTY = "__new__";

export function NewJobForm({
  clients,
  initialClientId,
}: {
  clients: ClientWithProperties[];
  initialClientId?: string;
}) {
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? "");
  const [propertyChoice, setPropertyChoice] = useState("");
  const isNewClient = clientId === NEW_CLIENT;
  const properties = clients.find((c) => c.id === clientId)?.properties ?? [];
  const showNewPropertyFields = isNewClient || propertyChoice === NEW_PROPERTY;

  return (
    <form action={createJob} className="space-y-6">
      <Card>
        <CardHeader title="Job details" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Client" htmlFor="clientSelect" required>
              <Select
                id="clientSelect"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setPropertyChoice("");
                }}
              >
                {clients.length === 0 && <option value="">No clients yet</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CLIENT}>+ New client…</option>
              </Select>
              {!isNewClient && <input type="hidden" name="clientId" value={clientId} />}
            </FormField>

            {isNewClient ? (
              <FormField label="New client name" htmlFor="newClientName" required>
                <Input id="newClientName" name="newClientName" required autoFocus />
              </FormField>
            ) : (
              <FormField label="Property" htmlFor="propertySelect" required>
                <Select
                  id="propertySelect"
                  value={propertyChoice || properties[0]?.id || ""}
                  onChange={(e) => setPropertyChoice(e.target.value)}
                  disabled={clients.length === 0}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || p.addressLine1}
                    </option>
                  ))}
                  <option value={NEW_PROPERTY}>+ New property…</option>
                </Select>
                {propertyChoice !== NEW_PROPERTY && (
                  <input type="hidden" name="propertyId" value={propertyChoice || properties[0]?.id || ""} />
                )}
              </FormField>
            )}
          </div>

          {showNewPropertyFields && (
            <div className="grid grid-cols-2 gap-4 rounded-md border border-[#E3DDD0] bg-[#FAF7F1] p-4">
              <div className="col-span-2">
                <FormField label="Street address" htmlFor="newAddressLine1" required>
                  <Input id="newAddressLine1" name="newAddressLine1" required placeholder="123 Main St" />
                </FormField>
              </div>
              <FormField label="City" htmlFor="newCity">
                <Input id="newCity" name="newCity" placeholder="Toronto" />
              </FormField>
              <FormField label="Postal code" htmlFor="newPostalCode">
                <Input id="newPostalCode" name="newPostalCode" />
              </FormField>
            </div>
          )}

          {clients.length === 0 && !isNewClient && (
            <p className="text-sm text-[#5B6B82]">
              No clients yet —{" "}
              <Link href="/clients/new" className="font-medium text-[#D9480F] hover:underline">
                add one here
              </Link>{" "}
              or choose &quot;+ New client…&quot; above.
            </p>
          )}

          <FormField label="Job title" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="e.g. Rooftop unit not cooling" />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={3} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Trade" htmlFor="trade" required>
              <Select id="trade" name="trade" required defaultValue="HVAC">
                <option value="HVAC">HVAC</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
              </Select>
            </FormField>
            <FormField
              label="Who prices this job?"
              htmlFor="pricingResponsibility"
              hint="Company-priced ticket work vs. subcontractor-priced same-day calls"
            >
              <Select id="pricingResponsibility" name="pricingResponsibility" defaultValue="COMPANY_PRICED">
                <option value="COMPANY_PRICED">Company-priced</option>
                <option value="SUBCONTRACTOR_PRICED">Subcontractor-priced</option>
              </Select>
            </FormField>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">Create job</Button>
      </div>
    </form>
  );
}
