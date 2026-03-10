import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investmentSnapshots, investments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export type SnapshotData = {
  investmentId: string;
  snapshotDate: string; // YYYY-MM-DD
  valueInCurrency: string;
  valueInInr?: string;
  valueInUsd?: string;
  exchangeRateToInr?: string;
  exchangeRateToUsd?: string;
  notes?: string;
};

export type SnapshotCsvRow = {
  investmentNameOrId: string;
  snapshotDate: string;
  valueInCurrency: string;
  valueInInr?: string;
  valueInUsd?: string;
  exchangeRateToInr?: string;
  exchangeRateToUsd?: string;
  notes?: string;
};

export async function upsertSnapshot(data: SnapshotData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership of the investment and get denormalized fields
  const [investment] = await db
    .select()
    .from(investments)
    .where(and(eq(investments.id, data.investmentId), eq(investments.userId, userId)));

  if (!investment) throw new Error('Investment not found');

  const [snapshot] = await db
    .insert(investmentSnapshots)
    .values({
      investmentId: data.investmentId,
      snapshotDate: new Date(data.snapshotDate),
      valueInCurrency: data.valueInCurrency,
      valueInInr: data.valueInInr,
      valueInUsd: data.valueInUsd,
      exchangeRateToInr: data.exchangeRateToInr,
      exchangeRateToUsd: data.exchangeRateToUsd,
      notes: data.notes,
      // Denormalized fields from parent investment
      accountTypeId: investment.accountTypeId,
      currencyId: investment.currencyId,
      nrType: investment.nrType,
    })
    .onConflictDoUpdate({
      target: [investmentSnapshots.investmentId, investmentSnapshots.snapshotDate],
      set: {
        valueInCurrency: sql`excluded.value_in_currency`,
        valueInInr: sql`excluded.value_in_inr`,
        valueInUsd: sql`excluded.value_in_usd`,
        exchangeRateToInr: sql`excluded.exchange_rate_to_inr`,
        exchangeRateToUsd: sql`excluded.exchange_rate_to_usd`,
        notes: sql`excluded.notes`,
      },
    })
    .returning();

  return snapshot;
}

export async function deleteSnapshot(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership via the parent investment
  const [snapshot] = await db
    .select({ investmentUserId: investments.userId })
    .from(investmentSnapshots)
    .innerJoin(investments, eq(investmentSnapshots.investmentId, investments.id))
    .where(eq(investmentSnapshots.id, id));

  if (!snapshot || snapshot.investmentUserId !== userId) {
    throw new Error('Snapshot not found');
  }

  await db.delete(investmentSnapshots).where(eq(investmentSnapshots.id, id));
}

export async function upsertSnapshotsFromCsv(rows: SnapshotCsvRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  if (rows.length === 0) return [];

  // Load user's investments for name → id resolution
  const userInvestments = await db
    .select()
    .from(investments)
    .where(eq(investments.userId, userId));

  const byId = new Map(userInvestments.map((i) => [i.id, i]));
  const byName = new Map(userInvestments.map((i) => [i.name.toLowerCase(), i]));

  const results = [];
  for (const row of rows) {
    const investment =
      byId.get(row.investmentNameOrId) ?? byName.get(row.investmentNameOrId.toLowerCase());
    if (!investment) throw new Error(`Investment not found: "${row.investmentNameOrId}"`);

    const [snapshot] = await db
      .insert(investmentSnapshots)
      .values({
        investmentId: investment.id,
        snapshotDate: new Date(row.snapshotDate),
        valueInCurrency: row.valueInCurrency,
        valueInInr: row.valueInInr,
        valueInUsd: row.valueInUsd,
        exchangeRateToInr: row.exchangeRateToInr,
        exchangeRateToUsd: row.exchangeRateToUsd,
        notes: row.notes,
        accountTypeId: investment.accountTypeId,
        currencyId: investment.currencyId,
        nrType: investment.nrType,
      })
      .onConflictDoUpdate({
        target: [investmentSnapshots.investmentId, investmentSnapshots.snapshotDate],
        set: {
          valueInCurrency: sql`excluded.value_in_currency`,
          valueInInr: sql`excluded.value_in_inr`,
          valueInUsd: sql`excluded.value_in_usd`,
          exchangeRateToInr: sql`excluded.exchange_rate_to_inr`,
          exchangeRateToUsd: sql`excluded.exchange_rate_to_usd`,
          notes: sql`excluded.notes`,
        },
      })
      .returning();

    results.push(snapshot);
  }

  return results;
}
