import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { invoiceStatusLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  DRAFT: "border-gray-200 bg-gray-100 text-gray-700",
  SENT: "border-indigo-200 bg-indigo-100 text-indigo-800",
  PARTIALLY_PAID: "border-amber-200 bg-amber-100 text-amber-800",
  PAID: "border-green-200 bg-green-100 text-green-800",
  OVERDUE: "border-red-200 bg-red-100 text-red-800",
  VOID: "border-gray-200 bg-gray-100 text-gray-500",
};

export default async function InvoicesPage() {
  await requireUser();
  const company = await getCompany();

  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  const outstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{formatCurrency(outstanding)} outstanding</p>
        </div>
        <LinkButton href="/invoices/new">+ New invoice</LinkButton>
      </div>

      <Card>
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">No invoices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Invoice</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Total</th>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{inv.client.name}</td>
                    <td className="px-5 py-3 text-gray-600">{formatCurrency(inv.total)}</td>
                    <td className="px-5 py-3 text-gray-600">{format(inv.dueDate, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3">
                      <Badge className={statusColors[inv.status]}>{invoiceStatusLabels[inv.status]}</Badge>
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
