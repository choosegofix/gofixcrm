import Link from "next/link";
import { ClipboardList, DollarSign, AlertCircle, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { jobStatusColors, jobStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await requireUser();
  const company = await getCompany();

  const [jobsInProgress, upcomingVisits, outstandingInvoices, paidThisMonth, recentJobs] =
    await Promise.all([
      prisma.job.count({
        where: { companyId: company.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      }),
      prisma.visit.findMany({
        where: {
          job: { companyId: company.id },
          scheduledStart: { gte: new Date() },
          status: "SCHEDULED",
        },
        orderBy: { scheduledStart: "asc" },
        take: 5,
        include: { job: { include: { client: true } } },
      }),
      prisma.invoice.aggregate({
        where: { companyId: company.id, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { total: true, amountPaid: true },
      }),
      prisma.payment.aggregate({
        where: {
          client: { companyId: company.id },
          paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
      prisma.job.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { client: true },
      }),
    ]);

  const outstanding =
    Number(outstandingInvoices._sum.total ?? 0) - Number(outstandingInvoices._sum.amountPaid ?? 0);

  const stats = [
    { label: "Jobs in progress", value: String(jobsInProgress), icon: ClipboardList },
    { label: "Revenue this month", value: formatCurrency(paidThisMonth._sum.amount ?? 0), icon: DollarSign },
    { label: "Outstanding invoices", value: formatCurrency(outstanding), icon: AlertCircle },
    { label: "Upcoming visits", value: String(upcomingVisits.length), icon: CalendarClock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#16233A]">Welcome back, {user.name}</h1>
        <p className="text-sm text-[#5B6B82]">Here&apos;s what&apos;s happening at GoFix Services.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#5B6B82]">
                  {s.label}
                </p>
                <p className="tabular-nums mt-1 font-mono text-2xl font-semibold text-[#16233A]">
                  {s.value}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FBE7DB] text-[#D9480F]">
                <s.icon size={17} strokeWidth={2} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming visits" />
          <CardBody className="p-0">
            {upcomingVisits.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#5B6B82]">Nothing scheduled yet.</p>
            ) : (
              <ul className="divide-y divide-[#EFEAE0]">
                {upcomingVisits.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/jobs/${v.jobId}`}
                        className="text-sm font-medium text-[#16233A] hover:text-[#D9480F]"
                      >
                        {v.job.title}
                      </Link>
                      <p className="text-xs text-[#5B6B82]">{v.job.client.name}</p>
                    </div>
                    <span className="tabular-nums font-mono text-xs text-[#5B6B82]">
                      {format(v.scheduledStart, "MMM d, h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent jobs"
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
                  <li key={j.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/jobs/${j.id}`}
                        className="text-sm font-medium text-[#16233A] hover:text-[#D9480F]"
                      >
                        {j.title}
                      </Link>
                      <p className="text-xs text-[#5B6B82]">{j.client.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={tradeColors[j.trade]}>{tradeLabels[j.trade]}</Badge>
                      <Badge className={jobStatusColors[j.status]}>{jobStatusLabels[j.status]}</Badge>
                    </div>
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
