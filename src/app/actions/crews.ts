"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import type { CrewType, Trade } from "@prisma/client";

export async function createCrew(formData: FormData) {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "INTERNAL") as CrewType;
  const trades = formData.getAll("trades").map((t) => String(t)) as Trade[];

  if (!name) throw new Error("Crew name is required.");

  const crew = await prisma.crew.create({
    data: {
      companyId: company.id,
      name,
      type,
      trades,
      contactEmail: String(formData.get("contactEmail") ?? "") || null,
      contactPhone: String(formData.get("contactPhone") ?? "") || null,
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
