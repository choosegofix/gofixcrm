import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOfficeOrAdmin } from "@/lib/session";
import { updateContactDetails, updateContactNotes } from "@/app/actions/contacts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function contactType(c: {
  clientId: string | null;
  leadId: string | null;
  crewId: string | null;
  userId: string | null;
  crewMember: { crewId: string } | null;
}) {
  if (c.leadId) return "Lead";
  if (c.crewId) return "Crew";
  if (c.clientId) return "Client";
  if (c.userId) return "Staff";
  if (c.crewMember) return "Crew member";
  return "General";
}

const TYPE_BADGE: Record<string, string> = {
  Client: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  Lead: "bg-[#FBEEDC] text-[#8A5A19] border-[#E9CBA0]",
  Crew: "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  "Crew member": "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  Staff: "bg-[#EFE3ED] text-[#6B3A5E] border-[#D9C0D3]",
  General: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOfficeOrAdmin();
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { client: true, lead: true, crew: true, user: true, crewMember: { include: { crew: true } } },
  });

  if (!contact) notFound();

  const type = contactType(contact);
  const sourceHref =
    type === "Client" && contact.clientId
      ? `/clients/${contact.clientId}`
      : type === "Crew" && contact.crewId
        ? `/crews/${contact.crewId}`
        : type === "Lead"
          ? "/leads"
          : type === "Staff"
            ? "/settings/users"
            : type === "Crew member" && contact.crewMember
              ? `/crews/${contact.crewMember.crewId}`
              : null;
  const sourceLabel =
    type === "Client" && contact.client
      ? contact.client.name
      : type === "Crew" && contact.crew
        ? contact.crew.name
        : type === "Lead"
          ? "Lead"
          : type === "Staff" && contact.user
            ? contact.user.role
            : type === "Crew member" && contact.crewMember
              ? contact.crewMember.crew.name
              : "General contact";

  const updateNotesForContact = updateContactNotes.bind(null, contact.id);
  const updateDetailsForContact = updateContactDetails.bind(null, contact.id);

  return (
    <div className="space-y-6">
      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-[#5B6B82] hover:text-[#D9480F]">
        <ArrowLeft size={14} strokeWidth={2} />
        Back to contacts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.title && <p className="text-sm text-[#5B6B82]">{contact.title}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={TYPE_BADGE[type]}>{type}</Badge>
            {contact.isPrimary && (
              <Badge className="border-[#DDD6C7] bg-[#EEEAE1] text-[#5B6B82]">Primary</Badge>
            )}
            {contact.isBilling && (
              <Badge className="border-[#DDD6C7] bg-[#EEEAE1] text-[#5B6B82]">Billing</Badge>
            )}
            {sourceHref ? (
              <Link href={sourceHref} className="text-sm font-medium text-[#D9480F] hover:underline">
                {sourceLabel} →
              </Link>
            ) : (
              <span className="text-sm text-[#8A93A3]">{sourceLabel}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Contact info"
            subtitle={
              type === "Staff"
                ? "Mirrors their Team & Settings account — edit login email there"
                : undefined
            }
          />
          <CardBody>
            <form action={updateDetailsForContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name" htmlFor="firstName" required>
                  <Input id="firstName" name="firstName" required defaultValue={contact.firstName} />
                </FormField>
                <FormField label="Last name" htmlFor="lastName">
                  <Input id="lastName" name="lastName" defaultValue={contact.lastName} />
                </FormField>
              </div>
              <FormField label="Title / company" htmlFor="title">
                <Input id="title" name="title" defaultValue={contact.title ?? ""} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Email" htmlFor="email">
                  <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} />
                </FormField>
                <FormField label="Phone" htmlFor="phone">
                  <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ""} />
                </FormField>
              </div>
              <FormField label="Preferred contact method" htmlFor="commPreference">
                <Select id="commPreference" name="commPreference" defaultValue={contact.commPreference}>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PHONE">Phone</option>
                  <option value="ANY">Any</option>
                </Select>
              </FormField>
              <Button type="submit" size="sm">Save changes</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Notes" subtitle="Internal — anything worth remembering about this contact" />
          <CardBody>
            <form action={updateNotesForContact} className="space-y-2">
              <Textarea
                name="notes"
                rows={5}
                defaultValue={contact.notes ?? ""}
                placeholder="e.g. Prefers texts over calls, usually on site Tuesdays, tricky gate code…"
              />
              <Button type="submit" size="sm">Save notes</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
