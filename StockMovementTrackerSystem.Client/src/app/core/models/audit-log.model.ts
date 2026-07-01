export interface AuditLogModel {
  auditLogId: string;
  productId: string;
  movementType: string | null;
  quantityChanged: number | null;
  oldStock: number | null;
  newStock: number | null;
  actionByUserId: string;
  logTimestamp: string | null;
   // UI Helper
  expanded?: boolean
}