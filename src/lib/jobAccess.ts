import { prisma } from "@/lib/prisma";

/**
 * Subcontractors should only see jobs assigned to them personally, or to a
 * crew they belong to — never the full company job list.
 */
export async function getAssignedJobIds(userId: string): Promise<string[]> {
  const memberships = await prisma.crewMember.findMany({
    where: { userId },
    select: { crewId: true },
  });
  const crewIds = memberships.map((m) => m.crewId);

  const assignments = await prisma.jobAssignment.findMany({
    where: {
      OR: [{ userId }, ...(crewIds.length ? [{ crewId: { in: crewIds } }] : [])],
    },
    select: { jobId: true },
  });

  return [...new Set(assignments.map((a) => a.jobId))];
}

export async function hasJobAccess(userId: string, jobId: string): Promise<boolean> {
  const memberships = await prisma.crewMember.findMany({
    where: { userId },
    select: { crewId: true },
  });
  const crewIds = memberships.map((m) => m.crewId);

  const count = await prisma.jobAssignment.count({
    where: {
      jobId,
      OR: [{ userId }, ...(crewIds.length ? [{ crewId: { in: crewIds } }] : [])],
    },
  });

  return count > 0;
}

/**
 * Guard for server actions that mutate a job. Throws (not just returns
 * false) so an action never silently no-ops for someone probing with a
 * guessed job ID -- this is the real enforcement; the page-level notFound()
 * only hides the UI.
 */
export async function requireJobAccess(user: { id: string; role: string }, jobId: string) {
  if (user.role !== "SUBCONTRACTOR") return;
  if (!(await hasJobAccess(user.id, jobId))) {
    throw new Error("You don't have access to this job.");
  }
}
