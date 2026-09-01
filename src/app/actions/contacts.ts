"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import type { CommPreference } from "@prisma/client";

export async function createGeneralContact(formData: FormData) {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("First name is required.");

  await prisma.contact.create({
    data: {
      companyId: company.id,
      firstName,
      lastName: String(formData.get("lastName") ?? "").trim(),
      title: String(formData.get("title") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      commPreference: (String(formData.get("commPreference") ?? "EMAIL") as CommPreference) || "EMAIL",
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/contacts");
}

export async function updateContactNotes(contactId: string, formData: FormData) {
  await requireOfficeOrAdmin();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.contact.update({
    where: { id: contactId },
    data: { notes: notes || null },
  });

  revalidatePath(`/contacts/${contactId}`);
}
