"use server";

import { z } from "zod";
import { upsertSnapshot, deleteSnapshot, upsertSnapshotsFromCsv } from "@/data/snapshots";

const snapshotSchema = z.object({
  investmentId: z.string().uuid(),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  valueInCurrency: z.string().min(1, "Value is required"),
  valueInInr: z.string().optional(),
  valueInUsd: z.string().optional(),
  exchangeRateToInr: z.string().optional(),
  exchangeRateToUsd: z.string().optional(),
  notes: z.string().optional(),
});

const deleteSnapshotSchema = z.object({
  id: z.number().int().positive(),
});

const csvRowSchema = z.object({
  investmentNameOrId: z.string().min(1),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  valueInHomeCurrency: z.string().min(1, "Value is required"),
});

export async function upsertSnapshotAction(params: {
  investmentId: string;
  snapshotDate: string;
  valueInCurrency: string;
  valueInInr?: string;
  valueInUsd?: string;
  exchangeRateToInr?: string;
  exchangeRateToUsd?: string;
  notes?: string;
}) {
  const parsed = snapshotSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const snapshot = await upsertSnapshot(parsed.data);
    return { success: true, snapshot };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save snapshot" };
  }
}

export async function deleteSnapshotAction(params: { id: number }) {
  const parsed = deleteSnapshotSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await deleteSnapshot(parsed.data.id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete snapshot" };
  }
}

export async function importSnapshotsAction(rows: unknown[]) {
  const parsed = z.array(csvRowSchema).safeParse(rows);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const snapshots = await upsertSnapshotsFromCsv(parsed.data);
    return { success: true, imported: snapshots.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to import snapshots" };
  }
}
