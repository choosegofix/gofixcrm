import Link from "next/link";
import { Users, ClipboardList, MapPin, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
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
          <p className="tabular-nums font-mono text-sm text-[#5B6B82]">{clients.length} active clients</p>
        </div>
        <LinkButton href="/clients/new">+ New client</LinkButton>
      </div>

      <Card>
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
            <ul className="divide-y divide-[#EFEAE0]">
              {clients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clients/${c.id}`}
                    className="group flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-5 py-3 transition hover:bg-[#FAF7F1]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E4EBF1] text-[#2E4A63]">
                        <Users size={16} strokeWidth={2} />
                      </div>
                      <p className="truncate font-medium text-[#16233A] group-hover:text-[#D9480F]">{c.name}</p>
                    </div>
                    <div className="ml-12 flex shrink-0 items-center gap-4 sm:ml-0">
                      <span className="flex items-center gap-1.5 text-xs text-[#5B6B82]">
                        <MapPin size={13} className="text-[#8A93A3]" />
                        <span className="tabular-nums font-mono">{c.properties.length}</span>
                        {c.properties.length === 1 ? "property" : "properties"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#5B6B82]">
                        <ClipboardList size={13} className="text-[#8A93A3]" />
                        <span className="tabular-nums font-mono">{c._count.jobs}</span>
                        {c._count.jobs === 1 ? "job" : "jobs"}
                      </span>
                      <ChevronRight
                        size={16}
                        className="hidden text-[#C7C0B0] opacity-0 transition group-hover:opacity-100 sm:block"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
