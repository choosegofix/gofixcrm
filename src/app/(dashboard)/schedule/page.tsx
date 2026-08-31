import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { tradeColors, tradeLabels, visitStatusColors, visitStatusLabels } from "@/lib/labels";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";

const RANGE_DAYS = 7;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  await requireUser();
  const company = await getCompany();
  const { start } = await searchParams;

  const rangeStart = start ? startOfDay(parseISO(start)) : startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, RANGE_DAYS);

  const visits = await prisma.visit.findMany({
    where: {
      job: { companyId: company.id },
      scheduledStart: { gte: rangeStart, lt: rangeEnd },
    },
    orderBy: { scheduledStart: "asc" },
    include: {
      job: {
        include: {
          client: true,
          property: true,
          assignments: { include: { user: true, crew: true } },
        },
      },
    },
  });

  const days = Array.from({ length: RANGE_DAYS }, (_, i) => addDays(rangeStart, i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Schedule</h1>
          <p className="text-sm text-[#5B6B82]">
            {format(rangeStart, "MMM d")} – {format(addDays(rangeEnd, -1), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/schedule?start=${format(addDays(rangeStart, -RANGE_DAYS), "yyyy-MM-dd")}`}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            ← Previous week
          </Link>
          <Link
            href={`/schedule?start=${format(new Date(), "yyyy-MM-dd")}`}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            Today
          </Link>
          <Link
            href={`/schedule?start=${format(addDays(rangeStart, RANGE_DAYS), "yyyy-MM-dd")}`}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            Next week →
          </Link>
        </div>
      </div>

      <p className="text-xs text-[#8A93A3]">
        Showing as a day-by-day list for now. Drag-and-drop and a full month/week grid are a later phase.
      </p>

      <div className="space-y-4">
        {days.map((day) => {
          const dayVisits = visits.filter((v) => isSameDay(v.scheduledStart, day));
          return (
            <Card key={day.toISOString()}>
              <div className="border-b border-[#EFEAE0] bg-[#FAF7F1] px-5 py-2">
                <p className="text-sm font-semibold text-[#16233A]">{format(day, "EEEE, MMM d")}</p>
              </div>
              <CardBody className="p-0">
                {dayVisits.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-[#8A93A3]">No visits scheduled.</p>
                ) : (
                  <ul className="divide-y divide-[#EFEAE0]">
                    {dayVisits.map((v) => (
                      <li key={v.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-20 text-xs font-medium text-[#5B6B82]">
                            {format(v.scheduledStart, "h:mm a")}
                          </span>
                          <div>
                            <Link
                              href={`/jobs/${v.jobId}`}
                              className="text-sm font-medium text-[#16233A] hover:text-[#D9480F]"
                            >
                              {v.job.title}
                            </Link>
                            <p className="text-xs text-[#5B6B82]">
                              {v.job.client.name} · {v.job.property.addressLine1}
                            </p>
                            {v.job.assignments.length > 0 && (
                              <p className="text-xs text-[#8A93A3]">
                                {v.job.assignments
                                  .map((a) => a.user?.name ?? a.crew?.name)
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={tradeColors[v.job.trade]}>{tradeLabels[v.job.trade]}</Badge>
                          <Badge className={visitStatusColors[v.status]}>{visitStatusLabels[v.status]}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
