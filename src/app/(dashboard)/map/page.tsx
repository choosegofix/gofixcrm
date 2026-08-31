import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { getAssignedJobIds } from "@/lib/jobAccess";
import { Card, CardBody } from "@/components/ui/Card";
import { ActiveJobsMap, type MapJob } from "@/components/map/ActiveJobsMap";
import { tradeLabels } from "@/lib/labels";

const ACTIVE_STATUSES = ["REQUESTED", "SCHEDULED", "IN_PROGRESS"] as const;

export default async function MapPage() {
  const user = await requireUser();
  const company = await getCompany();
  const assignedJobIds = user.role === "SUBCONTRACTOR" ? await getAssignedJobIds(user.id) : null;

  const jobs = await prisma.job.findMany({
    where: {
      companyId: company.id,
      status: { in: [...ACTIVE_STATUSES] },
      ...(assignedJobIds ? { id: { in: assignedJobIds } } : {}),
    },
    include: { client: true, property: true },
    orderBy: { createdAt: "desc" },
  });

  const withCoords = jobs.filter((j) => j.property.lat != null && j.property.lng != null);
  const withoutCoords = jobs.filter((j) => j.property.lat == null || j.property.lng == null);

  const mapJobs: MapJob[] = withCoords.map((j) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    title: j.title,
    clientName: j.client.name,
    address: `${j.property.addressLine1}, ${j.property.city}`,
    trade: j.trade,
    status: j.status,
    lat: j.property.lat as number,
    lng: j.property.lng as number,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#16233A]">Active projects</h1>
        <p className="text-sm text-[#5B6B82]">
          {jobs.length} active job{jobs.length === 1 ? "" : "s"} — requested, scheduled, or in progress
        </p>
      </div>

      {mapJobs.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-[#5B6B82]">
              No active jobs have a mappable address yet. New properties are located automatically from
              their address when you add them.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ActiveJobsMap jobs={mapJobs} />
      )}

      {withoutCoords.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-[#5B6B82]">
              Not shown on the map ({withoutCoords.length})
            </p>
            <p className="mt-1 text-xs text-[#8A93A3]">
              These properties couldn&apos;t be located automatically — usually an unusual or incomplete
              address.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#3A4A5F]">
              {withoutCoords.map((j) => (
                <li key={j.id}>
                  {j.jobNumber} · {j.title} — {j.property.addressLine1}, {j.property.city} (
                  {tradeLabels[j.trade]})
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
