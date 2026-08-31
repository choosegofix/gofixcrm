import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { getAssignedJobIds } from "@/lib/jobAccess";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { tradeColors, tradeLabels, visitStatusColors, visitStatusLabels } from "@/lib/labels";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const RANGE_DAYS = 7;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; view?: string }>;
}) {
  const user = await requireUser();
  const company = await getCompany();
  const { start, view: viewParam } = await searchParams;
  const view = viewParam === "month" ? "month" : "week";

  const anchor = start ? startOfDay(parseISO(start)) : startOfDay(new Date());
  const rangeStart = view === "month" ? startOfWeek(startOfMonth(anchor)) : anchor;
  const rangeEnd = view === "month" ? addDays(endOfWeek(endOfMonth(anchor)), 1) : addDays(anchor, RANGE_DAYS);

  const assignedJobIds = user.role === "SUBCONTRACTOR" ? await getAssignedJobIds(user.id) : null;

  const visits = await prisma.visit.findMany({
    where: {
      job: {
        companyId: company.id,
        ...(assignedJobIds ? { id: { in: assignedJobIds } } : {}),
      },
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

  const days = eachDayOfInterval({ start: rangeStart, end: addDays(rangeEnd, -1) });

  const prevHref =
    view === "month"
      ? `/schedule?view=month&start=${format(addMonths(anchor, -1), "yyyy-MM-dd")}`
      : `/schedule?start=${format(addDays(anchor, -RANGE_DAYS), "yyyy-MM-dd")}`;
  const nextHref =
    view === "month"
      ? `/schedule?view=month&start=${format(addMonths(anchor, 1), "yyyy-MM-dd")}`
      : `/schedule?start=${format(addDays(anchor, RANGE_DAYS), "yyyy-MM-dd")}`;
  const todayHref = view === "month" ? "/schedule?view=month" : "/schedule";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#16233A]">Schedule</h1>
          <p className="text-sm text-[#5B6B82]">
            {view === "month"
              ? format(anchor, "MMMM yyyy")
              : `${format(rangeStart, "MMM d")} – ${format(addDays(rangeEnd, -1), "MMM d, yyyy")}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-[#DDD6C7] p-0.5">
            <Link
              href="/schedule"
              className={`rounded px-3 py-1 text-sm font-medium ${
                view === "week" ? "bg-[#FBE7DB] text-[#D9480F]" : "text-[#5B6B82]"
              }`}
            >
              Week
            </Link>
            <Link
              href="/schedule?view=month"
              className={`rounded px-3 py-1 text-sm font-medium ${
                view === "month" ? "bg-[#FBE7DB] text-[#D9480F]" : "text-[#5B6B82]"
              }`}
            >
              Month
            </Link>
          </div>
          <Link
            href={prevHref}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            ← Previous
          </Link>
          <Link
            href={todayHref}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            Today
          </Link>
          <Link
            href={nextHref}
            className="rounded-md border border-[#DDD6C7] px-3 py-1.5 text-sm text-[#3A4A5F] hover:bg-[#FAF7F1]"
          >
            Next →
          </Link>
        </div>
      </div>

      {view === "week" && (
        <p className="text-xs text-[#8A93A3]">
          Showing as a day-by-day list. Drag-and-drop scheduling is a later phase.
        </p>
      )}

      {view === "month" ? (
        <Card>
          <div className="grid grid-cols-7 border-b border-[#EFEAE0] bg-[#FAF7F1] text-center text-xs font-semibold uppercase tracking-wide text-[#5B6B82]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayVisits = visits.filter((v) => isSameDay(v.scheduledStart, day));
              const inMonth = isSameMonth(day, anchor);
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[6.5rem] border-b border-r border-[#EFEAE0] p-1.5 last:border-r-0 ${
                    inMonth ? "" : "bg-[#FAF7F1]/60"
                  }`}
                >
                  <p className={`text-xs font-medium ${inMonth ? "text-[#16233A]" : "text-[#B8B0A0]"}`}>
                    {format(day, "d")}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {dayVisits.slice(0, 3).map((v) => (
                      <Link
                        key={v.id}
                        href={`/jobs/${v.jobId}`}
                        className="block truncate rounded bg-[#E4EBF1] px-1 py-0.5 text-[11px] text-[#2E4A63] hover:bg-[#D6E0EA]"
                        title={v.job.title}
                      >
                        {format(v.scheduledStart, "h:mma")} {v.job.title}
                      </Link>
                    ))}
                    {dayVisits.length > 3 && (
                      <p className="px-1 text-[11px] text-[#8A93A3]">+{dayVisits.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
