"use client";

import { useState } from "react";
import { FormField, Select } from "@/components/ui/Field";
import type { Client, Property } from "@prisma/client";

type ClientWithProperties = Client & { properties: Property[] };

export function ClientPropertySelect({
  clients,
  initialClientId,
  clientOptional = false,
}: {
  clients: ClientWithProperties[];
  initialClientId?: string;
  clientOptional?: boolean;
}) {
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const properties = clients.find((c) => c.id === clientId)?.properties ?? [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Client" htmlFor="clientId" required={!clientOptional}>
        <Select
          id="clientId"
          name="clientId"
          required={!clientOptional}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          {clientOptional && <option value="">— new prospect, no client yet —</option>}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Property" htmlFor="propertyId" required={!clientOptional}>
        <Select id="propertyId" name="propertyId" required={!clientOptional} disabled={properties.length === 0}>
          {properties.length === 0 && <option value="">— none available —</option>}
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label || p.addressLine1}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
