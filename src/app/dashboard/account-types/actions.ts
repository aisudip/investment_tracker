"use server";

import { z } from "zod";
import { createAccountType, updateAccountType, deleteAccountType } from "@/data/account-types";

const accountTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const updateSchema = accountTypeSchema.partial().extend({
  id: z.number().int().positive(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function createAccountTypeAction(params: { name: string; description?: string }) {
  const parsed = accountTypeSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const row = await createAccountType(parsed.data);
    return { success: true, row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create account type" };
  }
}

export async function updateAccountTypeAction(params: { id: number; name?: string; description?: string }) {
  const parsed = updateSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...data } = parsed.data;
  try {
    const row = await updateAccountType(id, data);
    return { success: true, row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update account type" };
  }
}

export async function deleteAccountTypeAction(params: { id: number }) {
  const parsed = deleteSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await deleteAccountType(parsed.data.id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete account type" };
  }
}
