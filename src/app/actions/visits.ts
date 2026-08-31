"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { requireJobAccess } from "@/lib/jobAccess";
import type { VisitStatus } from "@prisma/client";

export async function createVisit(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);

  const scheduledStart = String(formData.get("scheduledStart") ?? "");
  const scheduledEnd = String(formData.get("scheduledEnd") ?? "");
  if (!scheduledStart || !scheduledEnd) {
    throw new Error("Start and end times are required.");
  }

  const visitCount = await prisma.visit.count({ where: { jobId } });

  await prisma.visit.create({
    data: {
      jobId,
      visitNumber: visitCount + 1,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  // Keep the job's own schedule fields roughly in sync with its next visit.
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  if (!job.scheduledStart || new Date(scheduledStart) < job.scheduledStart) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        status: job.status === "REQUESTED" ? "SCHEDULED" : job.status,
      },
    });
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/schedule");
}

export async function updateVisitStatus(jobId: string, visitId: string, status: VisitStatus) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);

  const data: { status: VisitStatus; actualStart?: Date; actualEnd?: Date } = { status };
  if (status === "IN_PROGRESS") data.actualStart = new Date();
  if (status === "COMPLETED") data.actualEnd = new Date();

  await prisma.visit.update({ where: { id: visitId }, data });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/schedule");
}
