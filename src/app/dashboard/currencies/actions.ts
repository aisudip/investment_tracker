"use server";

import { z } from "zod";
import { createCurrency, updateCurrency, deleteCurrency } from "@/data/currencies";

const currencySchema = z.object({
  code: z.string().min(1, "Code is required").max(10),
  name: z.string().optional(),
  symbol: z.string().optional(),
});

const updateSchema = currencySchema.partial().extend({
  id: z.number().int().positive(),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});

export async function createCurrencyAction(params: { code: string; name?: string; symbol?: string }) {
  const parsed = currencySchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const row = await createCurrency(parsed.data);
    return { success: true, row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create currency" };
  }
}

export async function updateCurrencyAction(params: { id: number; code?: string; name?: string; symbol?: string }) {
  const parsed = updateSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...data } = parsed.data;
  try {
    const row = await updateCurrency(id, data);
    return { success: true, row };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update currency" };
  }
}

export async function deleteCurrencyAction(params: { id: number }) {
  const parsed = deleteSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await deleteCurrency(parsed.data.id);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete currency" };
  }
}
