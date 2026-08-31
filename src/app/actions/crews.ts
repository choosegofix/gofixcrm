"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { findOrCreateServiceArea } from "@/lib/serviceArea";
import type { CrewType, Trade } from "@prisma/client";

export async function createCrew(formData: FormData) {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "INTERNAL") as CrewType;
  const trades = formData.getAll("trades").map((t) => String(t)) as Trade[];
  const existingAreaIds = formData.getAll("serviceAreaIds").map((v) => String(v));
  const newAreaNames = String(formData.get("newServiceAreas") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name) throw new Error("Crew name is required.");
  if (existingAreaIds.length === 0 && newAreaNames.length === 0) {
    throw new Error("Every crew needs at least one area of operation.");
  }

  const newAreas = await Promise.all(
    newAreaNames.map((areaName) => findOrCreateServiceArea(company.id, areaName))
  );
  const allAreaIds = [...existingAreaIds, ...newAreas.map((a) => a?.id).filter((id): id is string => !!id)];

  const contactEmail = String(formData.get("contactEmail") ?? "") || null;
  const contactPhone = String(formData.get("contactPhone") ?? "") || null;

  const crew = await prisma.crew.create({
    data: {
      companyId: company.id,
      name,
      type,
      trades,
      contactEmail,
      contactPhone,
      serviceAreas: {
        create: allAreaIds.map((serviceAreaId) => ({ serviceAreaId })),
      },
    },
  });

  // Every crew automatically shows up in the general Contacts directory too.
  const [firstName, ...rest] = name.split(" ");
  await prisma.contact.create({
    data: {
      companyId: company.id,
      crewId: crew.id,
      firstName,
      lastName: rest.join(" "),
      title: type === "SUBCONTRACTOR" ? "Subcontractor" : "Crew",
      email: contactEmail,
      phone: contactPhone,
    },
  });

  redirect(`/crews/${crew.id}`);
}

export async function addCrewMember(crewId: string, formData: FormData) {
  await requireOfficeOrAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Choose a team member.");

  await prisma.crewMember.create({ data: { crewId, userId } });
  revalidatePath(`/crews/${crewId}`);
}
