import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export default async function ClientsPage() {
  await requireUser();
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
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} active clients</p>
        </div>
        <LinkButton href="/clients/new">+ New client</LinkButton>
      </div>

      <Card>
        <CardHeader title="All clients" />
        <CardBody className="p-0">
          {clients.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">
              No clients yet. Add your first one to get started.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Properties</th>
                  <th className="px-5 py-2 font-medium">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/clients/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.properties.length}</td>
                    <td className="px-5 py-3 text-gray-600">{c._count.jobs}</td>
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
