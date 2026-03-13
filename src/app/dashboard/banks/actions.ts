"use server";

import { z } from "zod";
import { createBank, updateBank, deleteBank, createBanksFromCsv } from "@/data/banks";

const bankSchema = z.object({
  name: z.string().min(1, "Bank name is required"),
  branch: z.string().optional(),
  ifsc: z.string().optional(),
  swiftCode: z.string().optional(),
  address: z.string().optional(),
  rmName: z.string().optional(),
  rmEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  rmPhone: z.string().optional(),
});

const updateBankSchema = bankSchema.partial().extend({
  id: z.number().int().positive(),
});

const deleteBankSchema = z.object({
  id: z.number().int().positive(),
});

const csvRowSchema = z.object({
  name: z.string().min(1),
  branch: z.string().optional(),
  ifsc: z.string().optional(),
  swiftCode: z.string().optional(),
  address: z.string().optional(),
  rmName: z.string().optional(),
  rmEmail: z.string().optional(),
  rmPhone: z.string().optional(),
});

export async function createBankAction(params: {
  name: string;
  branch?: string;
  ifsc?: string;
  swiftCode?: string;
  address?: string;
  rmName?: string;
  rmEmail?: string;
  rmPhone?: string;
}) {
  const parsed = bankSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const bank = await createBank(parsed.data);
    return { success: true, bank };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create bank" };
  }
}

export async function updateBankAction(params: {
  id: number;
  name?: string;
  branch?: string;
  ifsc?: string;
  swiftCode?: string;
  address?: string;
  rmName?: string;
  rmEmail?: string;
  rmPhone?: string;
}) {
  const parsed = updateBankSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...data } = parsed.data;
  try {
    const bank = await updateBank(id, data);
    return { success: true, bank };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update bank" };
  }
}

export async function deleteBankAction(params: { id: number }) {
  const parsed = deleteBankSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await deleteBank(parsed.data.id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete bank" };
  }
}

export async function importBanksAction(rows: unknown[]) {
  const parsed = z.array(csvRowSchema).safeParse(rows);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const banks = await createBanksFromCsv(parsed.data);
    return { success: true, imported: banks.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to import banks" };
  }
}
