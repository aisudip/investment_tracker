"use server";

import { z } from "zod";
import {
  createInvestment,
  updateInvestment,
  deactivateInvestment,
  createInvestmentsFromCsv,
} from "@/data/investments";

const nrTypeEnum = z.enum(["NRO", "NRE", "NA"]);

const investmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountTypeId: z.number().int().positive("Account type is required"),
  currencyId: z.number().int().positive("Currency is required"),
  nrType: nrTypeEnum.default("NA"),
  usdAvailability: z.boolean().default(false),
  bankId: z.number().int().positive().optional(),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateInvestmentSchema = investmentSchema.partial().extend({
  id: z.string().uuid(),
});

const deactivateSchema = z.object({
  id: z.string().uuid(),
});

const csvRowSchema = z.object({
  name: z.string().min(1),
  accountType: z.string().min(1),
  currencyCode: z.string().min(1),
  nrType: z.string().optional(),
  usdAvailability: z.string().optional(),
  bankIfsc: z.string().optional(),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function createInvestmentAction(params: {
  name: string;
  accountTypeId: number;
  currencyId: number;
  nrType?: "NRO" | "NRE" | "NA";
  usdAvailability?: boolean;
  bankId?: number;
  accountNumber?: string;
  notes?: string;
}) {
  const parsed = investmentSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const investment = await createInvestment(parsed.data);
    return { success: true, investment };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create investment" };
  }
}

export async function updateInvestmentAction(params: {
  id: string;
  name?: string;
  accountTypeId?: number;
  currencyId?: number;
  nrType?: "NRO" | "NRE" | "NA";
  usdAvailability?: boolean;
  bankId?: number;
  accountNumber?: string;
  notes?: string;
  isActive?: boolean;
}) {
  const parsed = updateInvestmentSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...data } = parsed.data;
  try {
    const investment = await updateInvestment(id, data);
    return { success: true, investment };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update investment" };
  }
}

export async function deactivateInvestmentAction(params: { id: string }) {
  const parsed = deactivateSchema.safeParse(params);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const investment = await deactivateInvestment(parsed.data.id);
    return { success: true, investment };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to deactivate investment" };
  }
}

export async function importInvestmentsAction(rows: unknown[]) {
  const parsed = z.array(csvRowSchema).safeParse(rows);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const investments = await createInvestmentsFromCsv(parsed.data);
    return { success: true, imported: investments.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to import investments" };
  }
}
