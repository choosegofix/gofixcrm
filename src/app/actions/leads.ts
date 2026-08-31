"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
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

  await prisma.lead.create({
    data: {
      companyId: company.id,
      clientId,
      propertyId,
      contactName,
      contactEmail: String(formData.get("contactEmail") ?? "") || null,
      contactPhone: String(formData.get("contactPhone") ?? "") || null,
      source: String(formData.get("source") ?? "") || null,
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
