"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import { findOrCreateServiceArea } from "@/lib/serviceArea";
import type { CrewType, Trade } from "@prisma/client";

// Shared by createCrew and addCrewMember: a typed name either matches an
// existing active user (linked properly, so they keep their one real
// account) or becomes a name-only member with no CRM login -- for
// helpers/laborers who just need to show up on the schedule.
async function addMemberByName(crewId: string, companyId: string, typedName: string) {
  const name = typedName.trim();
  if (!name) return;

  const existingMembers = await prisma.crewMember.findMany({ where: { crewId }, include: { user: true } });
  const alreadyMember = existingMembers.some(
    (m) => (m.user?.name ?? m.name ?? "").toLowerCase() === name.toLowerCase()
  );
  if (alreadyMember) return;

  const matchedUser = await prisma.user.findFirst({
    where: { companyId, isActive: true, name: { equals: name, mode: "insensitive" } },
  });

  await prisma.crewMember.create({
    data: matchedUser ? { crewId, userId: matchedUser.id } : { crewId, name },
  });
}

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
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const memberCount = Number(formData.get("memberCount") ?? 0);
  const memberNames = Array.from({ length: memberCount }, (_, i) =>
    String(formData.get(`member_${i}`) ?? "").trim()
  ).filter(Boolean);

  const crew = await prisma.crew.create({
    data: {
      companyId: company.id,
      name,
      type,
      trades,
      contactEmail,
      contactPhone,
      notes,
      serviceAreas: {
        create: allAreaIds.map((serviceAreaId) => ({ serviceAreaId })),
      },
    },
  });

  for (const memberName of memberNames) {
    await addMemberByName(crew.id, company.id, memberName);
  }

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
  const name = String(formData.get("memberName") ?? "").trim();
  if (!name) throw new Error("Type a name to add.");

  const crew = await prisma.crew.findUniqueOrThrow({ where: { id: crewId }, select: { companyId: true } });
  await addMemberByName(crewId, crew.companyId, name);

  revalidatePath(`/crews/${crewId}`);
}

export async function updateCrewNotes(crewId: string, formData: FormData) {
  await requireOfficeOrAdmin();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.crew.update({
    where: { id: crewId },
    data: { notes: notes || null },
  });

  revalidatePath(`/crews/${crewId}`);
}
