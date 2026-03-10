import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investments, banks, accountTypes, currencies } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type InvestmentData = {
  name: string;
  accountTypeId: number;
  currencyId: number;
  nrType?: 'NRO' | 'NRE' | 'NA';
  usdAvailability?: boolean;
  bankId?: number;
  accountNumber?: string;
  notes?: string;
  isActive?: boolean;
};

export type InvestmentCsvRow = {
  name: string;
  accountType: string;    // resolved to accountTypeId
  currencyCode: string;   // resolved to currencyId
  nrType?: string;
  usdAvailability?: string;
  bankIfsc?: string;      // resolved to bankId
  accountNumber?: string;
  notes?: string;
};

export async function createInvestment(data: InvestmentData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [investment] = await db
    .insert(investments)
    .values({ ...data, userId })
    .returning();
  return investment;
}

export async function updateInvestment(id: string, data: Partial<InvestmentData>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [investment] = await db
    .update(investments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .returning();
  return investment;
}

export async function deactivateInvestment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [investment] = await db
    .update(investments)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .returning();
  return investment;
}

export async function createInvestmentsFromCsv(rows: InvestmentCsvRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  if (rows.length === 0) return [];

  // Resolve lookup tables once for all rows
  const [allAccountTypes, allCurrencies, userBanks] = await Promise.all([
    db.select().from(accountTypes),
    db.select().from(currencies),
    db.select().from(banks).where(eq(banks.userId, userId)),
  ]);

  const accountTypeMap = new Map(allAccountTypes.map((a) => [a.name.toLowerCase(), a.id]));
  const currencyMap = new Map(allCurrencies.map((c) => [c.code.toLowerCase(), c.id]));
  const bankIfscMap = new Map(userBanks.filter((b) => b.ifsc).map((b) => [b.ifsc!.toLowerCase(), b.id]));

  const values = rows.map((row, i) => {
    const accountTypeId = accountTypeMap.get(row.accountType.toLowerCase());
    const currencyId = currencyMap.get(row.currencyCode.toLowerCase());
    if (!accountTypeId) throw new Error(`Row ${i + 1}: unknown account type "${row.accountType}"`);
    if (!currencyId) throw new Error(`Row ${i + 1}: unknown currency code "${row.currencyCode}"`);

    const bankId = row.bankIfsc ? bankIfscMap.get(row.bankIfsc.toLowerCase()) : undefined;
    const nrType = (row.nrType?.toUpperCase() as 'NRO' | 'NRE' | 'NA') ?? 'NA';

    return {
      userId,
      name: row.name,
      accountTypeId,
      currencyId,
      nrType,
      usdAvailability: row.usdAvailability?.toLowerCase() === 'true',
      bankId,
      accountNumber: row.accountNumber,
      notes: row.notes,
    };
  });

  return db.insert(investments).values(values).returning();
}
