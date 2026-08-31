import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { crewTypeLabels, tradeColors, tradeLabels } from "@/lib/labels";

export default async function CrewsPage() {
  await requireUser();
  const company = await getCompany();

  const crews = await prisma.crew.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: { name: "asc" },
    include: { members: { include: { user: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Crews</h1>
          <p className="text-sm text-[#5B6B82]">Internal crews and subcontractors</p>
        </div>
        <LinkButton href="/crews/new">+ New crew</LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crews.map((c) => (
          <Link key={c.id} href={`/crews/${c.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[#16233A]">{c.name}</p>
                    <p className="text-xs text-[#5B6B82]">{crewTypeLabels[c.type]}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.trades.map((t) => (
                    <Badge key={t} className={tradeColors[t]}>
                      {tradeLabels[t]}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#5B6B82]">
                  {c.members.length} member{c.members.length === 1 ? "" : "s"}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
        {crews.length === 0 && (
          <p className="text-sm text-[#5B6B82]">No crews yet.</p>
        )}
      </div>
    </div>
  );
}
