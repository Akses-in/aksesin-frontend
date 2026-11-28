"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/place";
import { adminAccessToken, adminApi, type ApiResult } from "../_impor-osm/backend";
import {
  validateDecisionInput,
  validateRenewInput,
  validateRevokeInput,
  type AdminCardDetail,
} from "./labels";

const invalidId = { ok: false, status: 400, message: "ID pengajuan tidak valid." } as const;

export async function submitCardDecision(
  cardId: string,
  input: { decision: string; reason: string; validityMonths?: number },
): Promise<ApiResult<AdminCardDetail>> {
  if (!isUuid(cardId)) return invalidId;
  const validated = validateDecisionInput(input);
  if (!validated.ok) return { ok: false, status: 400, message: validated.error };

  const result = await adminApi<AdminCardDetail>(
    `/api/admin/card-applications/${cardId}/decision`,
    await adminAccessToken(true),
    {
      method: "POST",
      body: {
        decision: validated.decision,
        reason: validated.reason,
        ...(validated.validityMonths !== undefined ? { validityMonths: validated.validityMonths } : {}),
      },
    },
  );
  if (result.ok) {
    revalidatePath("/admin/kartu-digital");
    revalidatePath(`/admin/kartu-digital/${cardId}`);
  }
  return result;
}

export async function renewIssuedCard(
  cardId: string,
  input: { validityMonths: number; reason: string },
): Promise<ApiResult<AdminCardDetail>> {
  if (!isUuid(cardId)) return invalidId;
  const validated = validateRenewInput(input);
  if (!validated.ok) return { ok: false, status: 400, message: validated.error };

  const result = await adminApi<AdminCardDetail>(
    `/api/admin/card-applications/${cardId}/renew`,
    await adminAccessToken(true),
    {
      method: "POST",
      body: {
        validityMonths: validated.validityMonths,
        reason: validated.reason,
      },
    },
  );
  if (result.ok) {
    revalidatePath("/admin/kartu-digital");
    revalidatePath(`/admin/kartu-digital/${cardId}`);
  }
  return result;
}

export async function revokeIssuedCard(
  cardId: string,
  input: { reason: string; confirm: boolean },
): Promise<ApiResult<AdminCardDetail>> {
  if (!isUuid(cardId)) return invalidId;
  const validated = validateRevokeInput(input);
  if (!validated.ok) return { ok: false, status: 400, message: validated.error };

  const result = await adminApi<AdminCardDetail>(
    `/api/admin/card-applications/${cardId}/revoke`,
    await adminAccessToken(true),
    {
      method: "POST",
      body: {
        reason: validated.reason,
        confirm: true,
      },
    },
  );
  if (result.ok) {
    revalidatePath("/admin/kartu-digital");
    revalidatePath(`/admin/kartu-digital/${cardId}`);
  }
  return result;
}
