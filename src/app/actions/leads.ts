"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { findOrCreateServiceArea } from "@/lib/serviceArea";
import type { LeadStatus, Trade } from "@prisma/client";

export async function createLead(formData: FormData) {
  await requireUser();
  const company = await getCompany();

  const contactName = String(formData.get("contactName") ?? "").trim();
  const trade = String(formData.get("trade") ?? "") as Trade;
  const description = String(formData.get("description") ?? "").trim();

  if (!contactName || !trade || !description) {
    throw new Error("Contact name, trade, and description are required.");
  }

  const clientId = String(formData.get("clientId") ?? "") || null;
  const propertyId = String(formData.get("propertyId") ?? "") || null;
  const typedCity = String(formData.get("city") ?? "").trim();

  let city: string | null = typedCity || null;
  let serviceAreaId: string | undefined;

  if (propertyId && !typedCity) {
    // No override typed — inherit the linked property's area.
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    city = property?.city ?? null;
    serviceAreaId = property?.serviceAreaId ?? undefined;
  } else if (typedCity) {
    const serviceArea = await findOrCreateServiceArea(company.id, typedCity);
    serviceAreaId = serviceArea?.id;
  }

  const sourceRaw = String(formData.get("source") ?? "");
  const source =
    sourceRaw === "OTHER" ? String(formData.get("sourceOther") ?? "").trim() || null : sourceRaw || null;

  await prisma.lead.create({
    data: {
      companyId: company.id,
      clientId,
      propertyId,
      contactName,
      contactEmail: String(formData.get("contactEmail") ?? "") || null,
      contactPhone: String(formData.get("contactPhone") ?? "") || null,
      city,
      serviceAreaId,
      source,
      trade,
      description,
    },
  });

  redirect("/leads");
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  await requireUser();
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  revalidatePath("/leads");
}
