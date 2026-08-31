"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { requireJobAccess } from "@/lib/jobAccess";

export async function createJobComment(jobId: string, formData: FormData) {
  const user = await requireUser();
  await requireJobAccess(user, jobId);
  const company = await getCompany();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment can't be empty.");

  const [job, users, crews] = await Promise.all([
    prisma.job.findUniqueOrThrow({ where: { id: jobId }, select: { title: true, jobNumber: true } }),
    prisma.user.findMany({ where: { companyId: company.id, isActive: true } }),
    prisma.crew.findMany({
      where: { companyId: company.id, isActive: true },
      include: { members: { include: { user: true } } },
    }),
  ]);

  // Longest names first so "Dave Chen" matches before a bare "Dave" would.
  const userMatches = users
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => b.name.length - a.name.length)
    .filter((u) => body.includes(`@${u.name}`));
  const crewMatches = crews
    .map((c) => ({ id: c.id, name: c.name, memberUserIds: c.members.map((m) => m.userId) }))
    .sort((a, b) => b.name.length - a.name.length)
    .filter((c) => body.includes(`@${c.name}`));

  await prisma.comment.create({
    data: {
      companyId: company.id,
      jobId,
      authorId: user.id,
      body,
      mentions: {
        create: [
          ...userMatches.map((u) => ({ userId: u.id })),
          ...crewMatches.map((c) => ({ crewId: c.id })),
        ],
      },
    },
  });

  const notifyUserIds = new Set<string>([
    ...userMatches.map((u) => u.id),
    ...crewMatches.flatMap((c) => c.memberUserIds),
  ]);
  notifyUserIds.delete(user.id); // don't notify yourself

  if (notifyUserIds.size > 0) {
    await prisma.notification.createMany({
      data: [...notifyUserIds].map((userId) => ({
        userId,
        type: "job_mention",
        title: `${user.name} mentioned you on ${job.jobNumber}`,
        body: body.slice(0, 200),
        relatedEntityType: "Job",
        relatedEntityId: jobId,
      })),
    });
  }

  revalidatePath(`/jobs/${jobId}`);
}
