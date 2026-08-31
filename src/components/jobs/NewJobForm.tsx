"use client";

import { useState } from "react";
import Link from "next/link";
import { createJob } from "@/app/actions/jobs";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Client, Property } from "@prisma/client";

type ClientWithProperties = Client & { properties: Property[] };

export function NewJobForm({
  clients,
  initialClientId,
}: {
  clients: ClientWithProperties[];
  initialClientId?: string;
}) {
  const [clientId, setClientId] = useState(initialClientId ?? clients[0]?.id ?? "");
  const properties = clients.find((c) => c.id === clientId)?.properties ?? [];

  if (clients.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-gray-600">
            You&apos;ll need a client (and at least one property) before you can create a job.
          </p>
          <Link href="/clients/new" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
            Add a client first →
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={createJob} className="space-y-6">
      <Card>
        <CardHeader title="Job details" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Client" htmlFor="clientId" required>
              <Select
                id="clientId"
                name="clientId"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Property" htmlFor="propertyId" required>
              <Select id="propertyId" name="propertyId" required disabled={properties.length === 0}>
                {properties.length === 0 && <option value="">No properties on file</option>}
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label || p.addressLine1}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

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
