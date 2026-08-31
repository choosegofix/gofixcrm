import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  companyId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedByUserId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      companyId: params.companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      performedByUserId: params.performedByUserId,
      metadata: params.metadata,
    },
  });
}
