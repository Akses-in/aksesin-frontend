import {
  availableAdminDecisions,
  validateDecisionInput,
  validateRenewInput,
  validateRevokeInput,
  type AdminDecision,
} from "@/lib/card-review";
import {
  cardStatusMap,
  cardStatuses,
  disabilityCategoryOptions,
  documentTypeOptions,
  type AllowedDocumentMime,
  type CardStatus,
  type DisabilityCategory,
  type DocumentType,
} from "@/lib/digital-card";

export {
  availableAdminDecisions,
  validateDecisionInput,
  validateRenewInput,
  validateRevokeInput,
  type AdminDecision,
};
export type CardHistoryAction =
  | "submitted"
  | "resubmitted"
  | "status_changed"
  | "issued"
  | "renewed"
  | "revoked"
  | "cancelled";
export type ActorRole = "user" | "admin" | "system";
export type IssuedCardState = "active" | "expired" | "revoked";

export type AdminCardSummary = {
  id: string;
  userId: string;
  fullName: string;
  disabilityCategory: DisabilityCategory;
  status: CardStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
  documentCount: number;
  cardNumber: string | null;
  expiresAt: string | null;
  cardState: IssuedCardState | null;
};

export type AdminCardListResult = {
  items: AdminCardSummary[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<CardStatus, number>;
};

export type AdminCardEvidence = {
  id: string;
  cardId: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: AllowedDocumentMime;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
};

export type AdminCardHistoryEntry = {
  id: string;
  cardId: string;
  actorId: string | null;
  actorName: string;
  actorRole: ActorRole;
  action: CardHistoryAction;
  previousStatus: CardStatus | null;
  newStatus: CardStatus;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AdminIssuedCard = {
  cardNumber: string;
  qrToken: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  state: IssuedCardState;
};

export type AdminCardDetail = {
  id: string;
  userId: string;
  fullName: string;
  disabilityCategory: DisabilityCategory;
  needs: string[];
  notes: string;
  consentGiven: boolean;
  consentAt: string;
  status: CardStatus;
  statusLabel: string;
  canEdit: boolean;
  canCancel: boolean;
  reviewerNote: string;
  submittedAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  cancelledAt: string | null;
  evidence: AdminCardEvidence | null;
  documents: AdminCardEvidence[];
  history: AdminCardHistoryEntry[];
  issuedCard: AdminIssuedCard | null;
};

export const cardStatusValues = cardStatuses;

export function statusBadge(status: CardStatus) {
  return cardStatusMap[status] ?? cardStatusMap.pending;
}

export function disabilityLabel(category: DisabilityCategory): string {
  return disabilityCategoryOptions.find(([value]) => value === category)?.[1] ?? category;
}

export function documentTypeLabel(type: DocumentType): string {
  return documentTypeOptions.find(([value]) => value === type)?.[1] ?? type;
}

export const issuedCardStateMeta: Record<IssuedCardState, { label: string; badgeClass: string }> = {
  active: { label: "Kartu aktif", badgeClass: "badge active" },
  expired: { label: "Masa berlaku habis", badgeClass: "badge warning" },
  revoked: { label: "Kartu dicabut", badgeClass: "badge danger" },
};

export const historyActionLabels: Record<CardHistoryAction, string> = {
  submitted: "Pengajuan dikirim",
  resubmitted: "Perbaikan dikirim ulang",
  status_changed: "Status diperbarui",
  issued: "Kartu disetujui & diterbitkan",
  renewed: "Masa berlaku diperpanjang",
  revoked: "Kartu dicabut",
  cancelled: "Pengajuan dibatalkan",
};

export const actorRoleLabels: Record<ActorRole, string> = {
  user: "Pemohon",
  admin: "Admin",
  system: "Sistem",
};

