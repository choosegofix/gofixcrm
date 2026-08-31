"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { requireJobAccess } from "@/lib/jobAccess";

export async function createTask(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);
  const company = await getCompany();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A task needs a title.");

  const count = await prisma.task.count({ where: { jobId } });

  await prisma.task.create({
    data: {
      companyId: company.id,
      jobId,
      title,
      requiresPhoto: formData.get("requiresPhoto") === "on",
      sortOrder: count,
      createdByUserId: user.id,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function toggleTask(jobId: string, taskId: string) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  const nowOpen = task.status === "COMPLETED";

  await prisma.task.update({
    where: { id: taskId },
    data: nowOpen
      ? { status: "OPEN", completedAt: null, completedByUserId: null }
      : { status: "COMPLETED", completedAt: new Date(), completedByUserId: user.id },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function applyTemplateToJob(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);
  const company = await getCompany();

  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) throw new Error("Choose a checklist template.");

  const template = await prisma.taskTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  const existingCount = await prisma.task.count({ where: { jobId } });

  await prisma.task.createMany({
    data: template.items.map((item, i) => ({
      companyId: company.id,
      jobId,
      title: item.title,
      requiresPhoto: item.requiresPhoto,
      sortOrder: existingCount + i,
      createdByUserId: user.id,
    })),
  });

  revalidatePath(`/jobs/${jobId}`);
}
