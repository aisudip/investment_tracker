import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investmentSnapshots, investments, currencies } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
  valueInHomeCurrency: string;
};

async function fetchUsdToInrRate(date: string): Promise<number> {
  const res = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=INR`);
  if (!res.ok) throw new Error(`Failed to fetch USD/INR rate for ${date}: ${res.statusText}`);
  const data = await res.json();
  const rate = data?.rates?.INR;
  if (!rate) throw new Error(`No INR rate returned for ${date}`);
  return rate;
}

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

  // Load user's investments with their currency code for derivation
  const userInvestments = await db
    .select({
      id: investments.id,
      name: investments.name,
      accountTypeId: investments.accountTypeId,
      currencyId: investments.currencyId,
      nrType: investments.nrType,
      currencyCode: currencies.code,
    })
    .from(investments)
    .innerJoin(currencies, eq(investments.currencyId, currencies.id))
    .where(eq(investments.userId, userId));

  const byId = new Map(userInvestments.map((i) => [i.id, i]));
  const byName = new Map(userInvestments.map((i) => [i.name.toLowerCase(), i]));

  // Fetch USD→INR rates for all unique dates in one parallel batch
  const uniqueDates = [...new Set(rows.map((r) => r.snapshotDate))];
  const rateEntries = await Promise.all(
    uniqueDates.map(async (date) => [date, await fetchUsdToInrRate(date)] as [string, number])
  );
  const rateMap = new Map(rateEntries);

  const results = [];
  for (const row of rows) {
    const investment =
      byId.get(row.investmentNameOrId) ?? byName.get(row.investmentNameOrId.toLowerCase());
    if (!investment) throw new Error(`Investment not found: "${row.investmentNameOrId}"`);

    const value = parseFloat(row.valueInHomeCurrency);
    if (isNaN(value)) throw new Error(`Invalid value for "${row.investmentNameOrId}": "${row.valueInHomeCurrency}"`);
    const usdToInr = rateMap.get(row.snapshotDate)!;

    const currencyCode = investment.currencyCode.toUpperCase();

    let valueInInr: string | undefined;
    let valueInUsd: string | undefined;
    let exchangeRateToInr: string | undefined;
    let exchangeRateToUsd: string | undefined;

    if (currencyCode === 'INR') {
      valueInInr = value.toFixed(4);
      valueInUsd = (value / usdToInr).toFixed(4);
      exchangeRateToInr = '1';
      exchangeRateToUsd = (1 / usdToInr).toFixed(6);
    } else if (currencyCode === 'USD') {
      valueInUsd = value.toFixed(4);
      valueInInr = (value * usdToInr).toFixed(4);
      exchangeRateToUsd = '1';
      exchangeRateToInr = usdToInr.toFixed(4);
    }
    // Other currencies: inr/usd fields remain undefined (stored as null)

    const [snapshot] = await db
      .insert(investmentSnapshots)
      .values({
        investmentId: investment.id,
        snapshotDate: new Date(row.snapshotDate),
        valueInCurrency: value.toFixed(4),
        valueInInr,
        valueInUsd,
        exchangeRateToInr,
        exchangeRateToUsd,
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
        },
      })
      .returning();

    results.push(snapshot);
  }

  return results;
}
