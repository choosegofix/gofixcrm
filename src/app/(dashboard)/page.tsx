import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { jobStatusColors, jobStatusLabels, tradeColors, tradeLabels } from "@/lib/labels";
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
    { label: "Jobs in progress", value: jobsInProgress },
    { label: "Revenue this month", value: `$${Number(paidThisMonth._sum.amount ?? 0).toFixed(2)}` },
    { label: "Outstanding invoices", value: `$${outstanding.toFixed(2)}` },
    { label: "Upcoming visits", value: upcomingVisits.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Welcome back, {user.name}</h1>
        <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening at GoFix Services.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming visits" />
          <CardBody className="p-0">
            {upcomingVisits.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">Nothing scheduled yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingVisits.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/jobs/${v.jobId}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {v.job.title}
                      </Link>
                      <p className="text-xs text-gray-500">{v.job.client.name}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(v.scheduledStart, "MMM d, h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent jobs" action={<Link href="/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>} />
          <CardBody className="p-0">
            {recentJobs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-500">No jobs yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentJobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/jobs/${j.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {j.title}
                      </Link>
                      <p className="text-xs text-gray-500">{j.client.name}</p>
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
