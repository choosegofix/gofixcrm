import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientsPage() {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isArchived: false },
    orderBy: { name: "asc" },
    include: {
      properties: { select: { id: true } },
      _count: { select: { jobs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Clients</h1>
          <p className="text-sm text-[#5B6B82]">{clients.length} active clients</p>
        </div>
        <LinkButton href="/clients/new">+ New client</LinkButton>
      </div>

      <Card>
        <CardHeader title="All clients" />
        <CardBody className="p-0">
          {clients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start creating quotes and jobs for them."
              actionHref="/clients/new"
              actionLabel="+ New client"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Properties</th>
                  <th className="px-5 py-2 font-medium">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F1]">
                    <td className="px-5 py-3">
                      <Link href={`/clients/${c.id}`} className="font-medium text-[#16233A] hover:text-[#D9480F]">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[#5B6B82]">{c.properties.length}</td>
                    <td className="px-5 py-3 text-[#5B6B82]">{c._count.jobs}</td>
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
