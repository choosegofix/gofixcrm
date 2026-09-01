import Link from "next/link";
import {
  ClipboardList,
  DollarSign,
  AlertCircle,
  CalendarClock,
  ChevronRight,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { getAssignedJobIds } from "@/lib/jobAccess";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { jobStatusColors, jobStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await requireUser();
  const company = await getCompany();
  const isSubcontractor = user.role === "SUBCONTRACTOR";
  const isOfficeOrAdmin = user.role === "ADMIN" || user.role === "OFFICE";
  const assignedJobIds = isSubcontractor ? await getAssignedJobIds(user.id) : null;
  const jobScope = assignedJobIds ? { id: { in: assignedJobIds } } : {};

  const [jobsInProgress, upcomingVisits, outstandingInvoices, paidThisMonth, recentJobs] =
    await Promise.all([
      prisma.job.count({
        where: { companyId: company.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, ...jobScope },
      }),
      prisma.visit.findMany({
        where: {
          job: { companyId: company.id, ...jobScope },
          scheduledStart: { gte: new Date() },
          status: "SCHEDULED",
        },
        orderBy: { scheduledStart: "asc" },
        take: 5,
        include: { job: { include: { client: true } } },
      }),
      isSubcontractor
        ? null
        : prisma.invoice.aggregate({
            where: { companyId: company.id, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
            _sum: { total: true, amountPaid: true },
          }),
      isSubcontractor
        ? null
        : prisma.payment.aggregate({
            where: {
              client: { companyId: company.id },
              paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
            _sum: { amount: true },
          }),
      prisma.job.findMany({
        where: { companyId: company.id, ...jobScope },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { client: true },
      }),
    ]);

  const outstanding = outstandingInvoices
    ? Number(outstandingInvoices._sum.total ?? 0) - Number(outstandingInvoices._sum.amountPaid ?? 0)
    : 0;

  const stats = [
    {
      label: "Jobs in progress",
      value: String(jobsInProgress),
      icon: ClipboardList,
      accent: "#16233A",
    },
    {
      label: "Upcoming visits",
      value: String(upcomingVisits.length),
      icon: CalendarClock,
      accent: "#D9480F",
    },
    ...(isSubcontractor
      ? []
      : [
          {
            label: "Outstanding invoices",
            value: formatCurrency(outstanding),
            icon: AlertCircle,
            accent: "#B8433A",
          },
          {
            label: "Revenue this month",
            value: formatCurrency(paidThisMonth?._sum.amount ?? 0),
            icon: DollarSign,
            accent: "#1F7A5C",
          },
        ]),
  ];

  const quickActions = [
    { href: "/jobs/new", label: "New job", show: !isSubcontractor },
    { href: "/leads/new", label: "New lead", show: isOfficeOrAdmin },
    { href: "/quotes/new", label: "New quote", show: isOfficeOrAdmin },
    { href: "/schedule", label: "Schedule", show: true },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A93A3]">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold text-[#16233A]">Welcome back, {user.name}</h1>
          <p className="text-sm text-[#5B6B82]">Here&apos;s what&apos;s happening at GoFix Services.</p>
        </div>
        {quickActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DDD6C7] bg-white px-3 py-2 text-sm font-medium text-[#16233A] shadow-sm transition hover:border-[#D9480F] hover:text-[#D9480F]"
              >
                <Plus size={14} strokeWidth={2.5} />
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-[#E3DDD0] border-l-[3px] bg-white px-4 py-4 shadow-sm transition hover:shadow-md"
            style={{ borderLeftColor: s.accent }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${s.accent}14`, color: s.accent }}
            >
              <s.icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs leading-tight font-medium uppercase tracking-wide text-[#5B6B82]">
                {s.label}
              </p>
              <p className="tabular-nums mt-0.5 truncate font-mono text-xl font-semibold text-[#16233A] sm:text-2xl">
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader
            title="Upcoming visits"
            action={
              <Link href="/schedule" className="text-sm font-medium text-[#D9480F] hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {upcomingVisits.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#5B6B82]">Nothing scheduled yet.</p>
            ) : (
              <ul className="divide-y divide-[#EFEAE0]">
                {upcomingVisits.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/jobs/${v.jobId}`}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#FAF7F1]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#16233A] group-hover:text-[#D9480F]">
                          {v.job.title}
                        </p>
                        <p className="truncate text-xs text-[#5B6B82]">{v.job.client.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums font-mono text-xs text-[#5B6B82]">
                          {format(v.scheduledStart, "MMM d, h:mm a")}
                        </span>
                        <ChevronRight
                          size={15}
                          className="text-[#C7C0B0] opacity-0 transition group-hover:opacity-100"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            title={isSubcontractor ? "Your jobs" : "Recent jobs"}
            action={
              <Link href="/jobs" className="text-sm font-medium text-[#D9480F] hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {recentJobs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#5B6B82]">No jobs yet.</p>
            ) : (
              <ul className="divide-y divide-[#EFEAE0]">
                {recentJobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#FAF7F1]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#16233A] group-hover:text-[#D9480F]">
                          {j.title}
                        </p>
                        <p className="truncate text-xs text-[#5B6B82]">{j.client.name}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className={tradeColors[j.trade]}>{tradeLabels[j.trade]}</Badge>
                        <Badge className={jobStatusColors[j.status]}>{jobStatusLabels[j.status]}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
