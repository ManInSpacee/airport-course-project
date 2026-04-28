import { prisma } from '../lib/prisma'

export async function logAction(
  userId: number,
  action: string,
  entityType: string,
  entityId: number | null = null,
  details: string | null = null
): Promise<void> {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, details } })
}
