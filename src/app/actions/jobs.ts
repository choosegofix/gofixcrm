"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { formatRecordNumber } from "@/lib/numbers";
import { requireJobAccess } from "@/lib/jobAccess";
import { findOrCreateServiceArea } from "@/lib/serviceArea";
import { geocodeAddress } from "@/lib/geocode";
import type { JobStatus, Trade, PricingResponsibility } from "@prisma/client";

export async function createJob(formData: FormData) {
  const user = await requireUser();
  if (user.role === "SUBCONTRACTOR") throw new Error("Subcontractors can't create jobs.");
  const company = await getCompany();

  let clientId = String(formData.get("clientId") ?? "");
  let propertyId = String(formData.get("propertyId") ?? "");
  const newClientName = String(formData.get("newClientName") ?? "").trim();
  const newAddressLine1 = String(formData.get("newAddressLine1") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const trade = String(formData.get("trade") ?? "") as Trade;
  const pricingResponsibility = String(
    formData.get("pricingResponsibility") ?? "COMPANY_PRICED"
  ) as PricingResponsibility;

  if (!title || !trade) {
    throw new Error("Title and trade are required.");
  }

  // Inline "+ New client…" — create the client (and its first property) on the fly.
  if (newClientName) {
    if (!newAddressLine1) throw new Error("A street address is required for a new client.");
    const client = await prisma.client.create({
      data: { companyId: company.id, name: newClientName },
    });
    const city = String(formData.get("newCity") ?? "").trim() || "Toronto";
    const serviceArea = await findOrCreateServiceArea(company.id, city);
    const coords = await geocodeAddress(`${newAddressLine1}, ${city}, ON, Canada`);
    const property = await prisma.property.create({
      data: {
        clientId: client.id,
        addressLine1: newAddressLine1,
        city,
        serviceAreaId: serviceArea?.id,
        postalCode: String(formData.get("newPostalCode") ?? "") || null,
        lat: coords?.lat,
        lng: coords?.lng,
      },
    });
    clientId = client.id;
    propertyId = property.id;
  } else if (newAddressLine1) {
    // Inline "+ New property…" for an existing client.
    if (!clientId) throw new Error("Select a client for the new property.");
    const city = String(formData.get("newCity") ?? "").trim() || "Toronto";
    const serviceArea = await findOrCreateServiceArea(company.id, city);
    const coords = await geocodeAddress(`${newAddressLine1}, ${city}, ON, Canada`);
    const property = await prisma.property.create({
      data: {
        clientId,
        addressLine1: newAddressLine1,
        city,
        serviceAreaId: serviceArea?.id,
        postalCode: String(formData.get("newPostalCode") ?? "") || null,
        lat: coords?.lat,
        lng: coords?.lng,
      },
    });
    propertyId = property.id;
  }

  if (!clientId || !propertyId) {
    throw new Error("Client and property are required.");
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
  await requireJobAccess(user, jobId);
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
  if (user.role === "SUBCONTRACTOR") throw new Error("Only office staff can assign crews.");
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
  const user = await requireUser();
  if (user.role === "SUBCONTRACTOR") throw new Error("Only office staff can change assignments.");
  await prisma.jobAssignment.delete({ where: { id: assignmentId } });
  revalidatePath(`/jobs/${jobId}`);
}

export async function updateJobDescription(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);
  const description = String(formData.get("description") ?? "").trim();

  await prisma.job.update({
    where: { id: jobId },
    data: { description: description || null },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function updateJobNotes(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.job.update({
    where: { id: jobId },
    data: { notes: notes || null },
  });

  revalidatePath(`/jobs/${jobId}`);
}
