import { AuditLog } from '../models/AuditLog.mjs';

export async function logAudit({ actor, action, targetType, targetId, details, req }) {
  try {
    await AuditLog.create({
      actorId: actor?._id,
      actorEmail: actor?.email || 'system',
      actorRole: actor?.role || 'SYSTEM',
      action,
      targetType,
      targetId: String(targetId || ''),
      details,
      ip: req?.ip || req?.socket?.remoteAddress || '127.0.0.1',
      userAgent: req?.headers['user-agent'] || 'internal'
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error.message);
  }
}
