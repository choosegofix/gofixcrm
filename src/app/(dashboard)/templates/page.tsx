import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { tradeColors, tradeLabels } from "@/lib/labels";

export default async function TemplatesPage() {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const templates = await prisma.taskTemplate.findMany({
    where: { companyId: company.id },
    orderBy: { name: "asc" },
    include: { items: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Checklists/SOP</h1>
          <p className="text-sm text-[#5B6B82]">Apply a bundled task list to any job in one click</p>
        </div>
        <LinkButton href="/templates/new">+ New template</LinkButton>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={ClipboardCheck}
              title="No templates yet"
              description="Save a reusable checklist for a trade — e.g. a standard HVAC install — and apply it to any job."
              actionHref="/templates/new"
              actionLabel="+ New template"
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader title={t.name} />
              <CardBody>
                {t.trade && <Badge className={tradeColors[t.trade]}>{tradeLabels[t.trade]}</Badge>}
                <ul className="mt-3 space-y-1 text-sm text-[#3A4A5F]">
                  {t.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5">
                      <span className="text-[#8A93A3]">•</span>
                      <span>
                        {item.title}
                        {item.requiresPhoto && (
                          <span className="ml-1 text-xs text-[#8A5A19]">(photo)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
