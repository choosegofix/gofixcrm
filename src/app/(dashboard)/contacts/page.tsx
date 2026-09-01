import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { createGeneralContact } from "@/app/actions/contacts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

const TYPE_OPTIONS = [
  { value: "CLIENT", label: "Client" },
  { value: "LEAD", label: "Lead" },
  { value: "CREW", label: "Crew" },
  { value: "GENERAL", label: "General" },
];

const TYPE_BADGE: Record<string, string> = {
  Client: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  Lead: "bg-[#FBEEDC] text-[#8A5A19] border-[#E9CBA0]",
  Crew: "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  General: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
};

function contactType(c: { clientId: string | null; leadId: string | null; crewId: string | null }) {
  if (c.leadId) return "Lead";
  if (c.crewId) return "Crew";
  if (c.clientId) return "Client";
  return "General";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { q, type } = await searchParams;

  const typeFilter: Prisma.ContactWhereInput =
    type === "CLIENT"
      ? { clientId: { not: null }, leadId: null, crewId: null }
      : type === "LEAD"
        ? { leadId: { not: null } }
        : type === "CREW"
          ? { crewId: { not: null } }
          : type === "GENERAL"
            ? { clientId: null, leadId: null, crewId: null }
            : {};

  const contacts = await prisma.contact.findMany({
    where: {
      companyId: company.id,
      ...typeFilter,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    include: { client: true, lead: true, crew: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Contacts</h1>
          <p className="text-sm text-[#5B6B82]">
            Every client, lead, and crew contact in one place — {contacts.length} shown
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <form className="min-w-0 flex-1">
              <input
                type="text"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search name, email, or phone…"
                className="w-full rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#16233A] focus:border-[#D9480F] focus:outline-none focus:ring-1 focus:ring-[#D9480F]"
              />
            </form>
            <FilterSelect paramName="type" label="Type" options={TYPE_OPTIONS} allLabel="All types" />
          </div>

          <Card>
            <CardBody className="p-0">
              {contacts.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No contacts match"
                  description="Try clearing the search or type filter. New leads and crews are added here automatically."
                />
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                    <tr>
                      <th className="px-5 py-2 font-medium">Name</th>
                      <th className="px-5 py-2 font-medium">Email / Phone</th>
                      <th className="px-5 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {contacts.map((c) => {
                      const type = contactType(c);
                      const sourceLabel =
                        type === "Client" && c.client
                          ? c.client.name
                          : type === "Lead"
                            ? "Lead"
                            : type === "Crew" && c.crew
                              ? c.crew.name
                              : "General";
                      const sourceHref =
                        type === "Client" && c.clientId
                          ? `/clients/${c.clientId}`
                          : type === "Crew" && c.crewId
                            ? `/crews/${c.crewId}`
                            : type === "Lead"
                              ? "/leads"
                              : null;
                      return (
                        <tr key={c.id} className="hover:bg-[#FAF7F1]">
                          <td className="px-5 py-3">
                            <Link href={`/contacts/${c.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                              {c.firstName} {c.lastName}
                            </Link>
                            {c.title && <p className="text-xs text-[#5B6B82]">{c.title}</p>}
                          </td>
                          <td className="px-5 py-3 text-[#5B6B82]">
                            {c.email && <p>{c.email}</p>}
                            {c.phone && <p>{c.phone}</p>}
                            {!c.email && !c.phone && <span className="text-[#8A93A3]">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Badge className={TYPE_BADGE[type]}>{type}</Badge>
                              {sourceHref ? (
                                <Link href={sourceHref} className="text-xs text-[#D9480F] hover:underline">
                                  {sourceLabel}
                                </Link>
                              ) : (
                                <span className="text-xs text-[#8A93A3]">{sourceLabel}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Add a general contact" subtitle="Vendors, suppliers, anyone else worth keeping on file" />
          <CardBody>
            <form action={createGeneralContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name" htmlFor="firstName" required>
                  <Input id="firstName" name="firstName" required />
                </FormField>
                <FormField label="Last name" htmlFor="lastName">
                  <Input id="lastName" name="lastName" />
                </FormField>
              </div>
              <FormField label="Title / company" htmlFor="title">
                <Input id="title" name="title" placeholder="e.g. Parts Supplier — ACME Supply" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Email" htmlFor="email">
                  <Input id="email" name="email" type="email" />
                </FormField>
                <FormField label="Phone" htmlFor="phone">
                  <Input id="phone" name="phone" type="tel" />
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
              <FormField label="Notes" htmlFor="notes" hint="Internal only">
                <Textarea id="notes" name="notes" rows={3} />
              </FormField>
              <Button type="submit" className="w-full">
                Add contact
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
