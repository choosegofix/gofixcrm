"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin, requireUser } from "@/lib/session";
import { findOrCreateServiceArea } from "@/lib/serviceArea";
import { geocodeAddress } from "@/lib/geocode";
import type { CommPreference } from "@prisma/client";

export async function updateClientNotes(clientId: string, formData: FormData) {
  await requireOfficeOrAdmin();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.client.update({
    where: { id: clientId },
    data: { notes: notes || null },
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function createClient(formData: FormData) {
  const user = await requireUser();
  const company = await getCompany();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Client name is required.");

  const client = await prisma.client.create({
    data: {
      companyId: company.id,
      name,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  if (addressLine1) {
    const city = String(formData.get("city") ?? "").trim() || "Toronto";
    const serviceArea = await findOrCreateServiceArea(company.id, city);
    const coords = await geocodeAddress(`${addressLine1}, ${city}, ON, Canada`);
    await prisma.property.create({
      data: {
        clientId: client.id,
        label: String(formData.get("propertyLabel") ?? "") || null,
        addressLine1,
        city,
        serviceAreaId: serviceArea?.id,
        postalCode: String(formData.get("postalCode") ?? "") || null,
        lat: coords?.lat,
        lng: coords?.lng,
      },
    });
  }

  const contactFirstName = String(formData.get("contactFirstName") ?? "").trim();
  if (contactFirstName) {
    await prisma.contact.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        firstName: contactFirstName,
        lastName: String(formData.get("contactLastName") ?? "").trim(),
        title: String(formData.get("contactTitle") ?? "") || null,
        email: String(formData.get("contactEmail") ?? "") || null,
        phone: String(formData.get("contactPhone") ?? "") || null,
        isPrimary: true,
      },
    });
  }

  void user;
  redirect(`/clients/${client.id}`);
}

export async function addProperty(clientId: string, formData: FormData) {
  await requireUser();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  if (!addressLine1) throw new Error("Street address is required.");

  const city = String(formData.get("city") ?? "").trim() || "Toronto";
  const serviceArea = await findOrCreateServiceArea(client.companyId, city);
  const coords = await geocodeAddress(`${addressLine1}, ${city}, ON, Canada`);

  await prisma.property.create({
    data: {
      clientId,
      label: String(formData.get("label") ?? "") || null,
      addressLine1,
      addressLine2: String(formData.get("addressLine2") ?? "") || null,
      city,
      serviceAreaId: serviceArea?.id,
      postalCode: String(formData.get("postalCode") ?? "") || null,
      accessNotes: String(formData.get("accessNotes") ?? "") || null,
      lat: coords?.lat,
      lng: coords?.lng,
    },
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function addContact(clientId: string, formData: FormData) {
  await requireUser();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) throw new Error("First name is required.");

  await prisma.contact.create({
    data: {
      companyId: client.companyId,
      clientId,
      firstName,
      lastName: String(formData.get("lastName") ?? "").trim(),
      title: String(formData.get("title") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      commPreference: (String(formData.get("commPreference") ?? "EMAIL") as CommPreference) || "EMAIL",
      isPrimary: formData.get("isPrimary") === "on",
      isBilling: formData.get("isBilling") === "on",
    },
  });

  revalidatePath(`/clients/${clientId}`);
}
