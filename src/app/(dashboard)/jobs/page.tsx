import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  jobStatusColors,
  jobStatusLabels,
  jobStatusOrder,
  tradeColors,
  tradeLabels,
} from "@/lib/labels";
import { format } from "date-fns";
import type { JobStatus } from "@prisma/client";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const company = await getCompany();
  const { status } = await searchParams;

  const jobs = await prisma.job.findMany({
    where: {
      companyId: company.id,
      ...(status ? { status: status as JobStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { client: true, property: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500">{jobs.length} jobs</p>
        </div>
        <LinkButton href="/jobs/new">+ New job</LinkButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/jobs"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !status ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
          }`}
        >
          All
        </Link>
        {jobStatusOrder.map((s) => (
          <Link
            key={s}
            href={`/jobs?status=${s}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
            }`}
          >
            {jobStatusLabels[s]}
          </Link>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {jobs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No jobs match this filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Job</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Trade</th>
                  <th className="px-5 py-2 font-medium">Scheduled</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/jobs/${j.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {j.jobNumber} · {j.title}
                      </Link>
                      <p className="text-xs text-gray-500">{j.property.addressLine1}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{j.client.name}</td>
                    <td className="px-5 py-3">
                      <Badge className={tradeColors[j.trade]}>{tradeLabels[j.trade]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {j.scheduledStart ? format(j.scheduledStart, "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={jobStatusColors[j.status]}>{jobStatusLabels[j.status]}</Badge>
                    </td>
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
