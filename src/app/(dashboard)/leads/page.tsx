import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { leadStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { LeadStatusSelect } from "@/components/leads/LeadStatusSelect";
import { format } from "date-fns";
import type { LeadStatus } from "@prisma/client";

const pipeline: LeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

export default async function LeadsPage() {
  await requireUser();
  const company = await getCompany();

  const leads = await prisma.lead.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { client: true, property: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Inbound work requests, before they&apos;re quoted</p>
        </div>
        <LinkButton href="/leads/new">+ New lead</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {pipeline.map((status) => (
          <Card key={status}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {leadStatusLabels[status]}
              </p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {leads.filter((l) => l.status === status).length}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {leads.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No leads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Contact</th>
                  <th className="px-5 py-2 font-medium">Trade</th>
                  <th className="px-5 py-2 font-medium">Received</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{l.contactName}</p>
                      <p className="text-xs text-gray-500">
                        {l.client ? l.client.name : l.contactEmail || l.contactPhone || "New prospect"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={tradeColors[l.trade]}>{tradeLabels[l.trade]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{format(l.createdAt, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <LeadStatusSelect leadId={l.id} status={l.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {l.clientId && l.propertyId ? (
                        <Link
                          href={`/quotes/new?leadId=${l.id}&clientId=${l.clientId}&propertyId=${l.propertyId}`}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Create quote →
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">Add a client to quote</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
