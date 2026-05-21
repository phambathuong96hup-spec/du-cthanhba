/**
 * Centralized status utilities for the Equipment Management app.
 * Consolidates repair and transfer status logic and defines type-safe enums/constants.
 */

import type { BadgeVariant } from '../components/ui';

// ──────────────────────────────────────────────────
// Repair Status
// ──────────────────────────────────────────────────

export const REPAIR_STATUS = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CHECKING: 'Đang kiểm tra',
  REPAIRING: 'Đang sửa chữa',
  COMPLETED: 'Đã hoàn thành',
} as const;

export type RepairStatus = typeof REPAIR_STATUS[keyof typeof REPAIR_STATUS];

/** Human-readable labels for repair statuses. */
export const repairStatusText: Record<string, string> = {
  [REPAIR_STATUS.PENDING]: 'Chờ duyệt',
  [REPAIR_STATUS.APPROVED]: 'Đã duyệt',
  [REPAIR_STATUS.REJECTED]: 'Từ chối',
  [REPAIR_STATUS.CHECKING]: 'Đang kiểm tra',
  [REPAIR_STATUS.REPAIRING]: 'Đang sửa chữa',
  [REPAIR_STATUS.COMPLETED]: 'Đã hoàn thành',
};

/** Map a repair status string to a Badge variant for consistent color coding. */
export const getRepairStatusVariant = (status: string): BadgeVariant => {
  const s = status.toLowerCase();
  if (s.includes('hoàn thành') || s.includes('đã duyệt')) return 'success';
  if (s.includes('từ chối')) return 'danger';
  if (s.includes('chờ') || s.includes('kiểm tra')) return 'warning';
  if (s.includes('sửa')) return 'primary';
  return 'neutral';
};

/** Check if a repair status indicates the repair is completed. */
export const isRepairCompleted = (status: string): boolean =>
  status.toLowerCase().includes('hoàn thành');

/** Check if a repair status indicates the repair was rejected. */
export const isRepairRejected = (status: string): boolean =>
  status.toLowerCase().includes('từ chối');

/** Check if a repair status indicates the repair is pending (awaiting review). */
export const isRepairPending = (status: string): boolean =>
  status.toLowerCase().includes('chờ');

/** Check if a repair is in a terminal state (completed or rejected). */
export const isRepairDone = (status: string): boolean =>
  isRepairCompleted(status) || isRepairRejected(status);

// ──────────────────────────────────────────────────
// Transfer Status
// ──────────────────────────────────────────────────

export const TRANSFER_STATUS = {
  PENDING_RECEIVE: 'PENDING_RECEIVE',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransferStatus = typeof TRANSFER_STATUS[keyof typeof TRANSFER_STATUS];

/** Human-readable labels for transfer statuses. */
export const transferStatusText: Record<string, string> = {
  [TRANSFER_STATUS.PENDING_RECEIVE]: 'Chờ khoa nhận',
  [TRANSFER_STATUS.COMPLETED]: 'Đã nhận',
  [TRANSFER_STATUS.REJECTED]: 'Từ chối',
  [TRANSFER_STATUS.CANCELLED]: 'Đã hủy',
};

/** Map a transfer status string to a Badge variant for consistent color coding. */
export const getTransferStatusVariant = (status: string): BadgeVariant => {
  if (status === TRANSFER_STATUS.COMPLETED) return 'success';
  if (status === TRANSFER_STATUS.REJECTED || status === TRANSFER_STATUS.CANCELLED) return 'danger';
  if (status === TRANSFER_STATUS.PENDING_RECEIVE) return 'warning';
  return 'neutral';
};
