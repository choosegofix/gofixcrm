"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { formatRecordNumber } from "@/lib/numbers";
import type { JobStatus, Trade, PricingResponsibility } from "@prisma/client";

export async function createJob(formData: FormData) {
  const user = await requireUser();
  const company = await getCompany();

  const clientId = String(formData.get("clientId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const trade = String(formData.get("trade") ?? "") as Trade;
  const pricingResponsibility = String(
    formData.get("pricingResponsibility") ?? "COMPANY_PRICED"
  ) as PricingResponsibility;

  if (!clientId || !propertyId || !title || !trade) {
    throw new Error("Client, property, title, and trade are all required.");
  }

  const jobCount = await prisma.job.count({ where: { companyId: company.id } });

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      clientId,
      propertyId,
      jobNumber: formatRecordNumber("J", jobCount),
      title,
      description: String(formData.get("description") ?? "") || null,
      trade,
      pricingResponsibility,
      createdByUserId: user.id,
    },
  });

  await logAudit({
    companyId: company.id,
    entityType: "Job",
    entityId: job.id,
    action: "created",
    performedByUserId: user.id,
  });

  redirect(`/jobs/${job.id}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const user = await requireUser();
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

  const timestampField: Record<string, Date> = {};
  if (status === "COMPLETED") timestampField.completedAt = new Date();
  if (status === "INVOICED") timestampField.invoicedAt = new Date();
  if (status === "PAID") timestampField.paidAt = new Date();

  await prisma.job.update({
    where: { id: jobId },
    data: { status, ...timestampField },
  });

  await logAudit({
    companyId: job.companyId,
    entityType: "Job",
    entityId: job.id,
    action: "status_changed",
    performedByUserId: user.id,
    metadata: { from: job.status, to: status },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function assignToJob(jobId: string, formData: FormData) {
  const user = await requireUser();
  const userId = String(formData.get("userId") ?? "") || undefined;
  const crewId = String(formData.get("crewId") ?? "") || undefined;
  const role = String(formData.get("role") ?? "") || undefined;

  if (!userId && !crewId) throw new Error("Choose a crew or a person to assign.");

  await prisma.jobAssignment.create({
    data: { jobId, userId, crewId, role },
  });

  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  await logAudit({
    companyId: job.companyId,
    entityType: "Job",
    entityId: jobId,
    action: "assignment_added",
    performedByUserId: user.id,
    metadata: { userId, crewId },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function removeAssignment(jobId: string, assignmentId: string) {
  await requireUser();
  await prisma.jobAssignment.delete({ where: { id: assignmentId } });
  revalidatePath(`/jobs/${jobId}`);
}
