"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireOfficeOrAdmin } from "@/lib/session";
import type { Trade } from "@prisma/client";

export async function createTaskTemplate(formData: FormData) {
  await requireOfficeOrAdmin();
  const company = await getCompany();

  const name = String(formData.get("name") ?? "").trim();
  const tradeRaw = String(formData.get("trade") ?? "");
  const trade = (tradeRaw || null) as Trade | null;

  if (!name) throw new Error("A template needs a name.");

  const rowCount = Number(formData.get("rowCount") ?? 0);
  const items: { title: string; requiresPhoto: boolean; sortOrder: number }[] = [];
  for (let i = 0; i < rowCount; i++) {
    const title = String(formData.get(`title_${i}`) ?? "").trim();
    if (!title) continue;
    items.push({
      title,
      requiresPhoto: formData.get(`requiresPhoto_${i}`) === "on",
      sortOrder: items.length,
    });
  }

  if (items.length === 0) throw new Error("Add at least one task to the template.");

  await prisma.taskTemplate.create({
    data: {
      companyId: company.id,
      name,
      trade,
      items: { create: items },
    },
  });

  redirect("/templates");
}

export async function deleteTaskTemplate(templateId: string) {
  await requireOfficeOrAdmin();
  await prisma.taskTemplate.delete({ where: { id: templateId } });
  redirect("/templates");
}
