/**
 * Centralized status utilities for the Equipment Management app.
 * Consolidates repair and transfer status logic previously duplicated
 * across RepairRequest.tsx, AdminRepairs.tsx, and Transfers.tsx.
 */

import type { BadgeVariant } from '../components/ui';

// ──────────────────────────────────────────────────
// Repair Status
// ──────────────────────────────────────────────────

/** Human-readable labels for repair statuses. */
export const repairStatusText: Record<string, string> = {
  'Chờ duyệt': 'Chờ duyệt',
  'Đã duyệt': 'Đã duyệt',
  'Từ chối': 'Từ chối',
  'Đang kiểm tra': 'Đang kiểm tra',
  'Đang sửa chữa': 'Đang sửa chữa',
  'Đã hoàn thành': 'Đã hoàn thành',
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

/** Human-readable labels for transfer statuses. */
export const transferStatusText: Record<string, string> = {
  PENDING_RECEIVE: 'Chờ khoa nhận',
  COMPLETED: 'Đã nhận',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

/** Map a transfer status string to a Badge variant for consistent color coding. */
export const getTransferStatusVariant = (status: string): BadgeVariant => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
  if (status === 'PENDING_RECEIVE') return 'warning';
  return 'neutral';
};
