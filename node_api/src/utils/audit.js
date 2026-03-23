const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function logAction(userId, action, entityType, entityId = null, details = null) {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, details } })
}

module.exports = { logAction }
