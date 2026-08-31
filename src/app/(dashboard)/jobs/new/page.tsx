import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { NewJobForm } from "@/components/jobs/NewJobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireOfficeOrAdmin();
  const company = await getCompany();
  const { clientId } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isArchived: false },
    orderBy: { name: "asc" },
    include: { properties: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-[#16233A]">New job</h1>
      <NewJobForm clients={clients} initialClientId={clientId} />
    </div>
  );
}
