import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investmentSnapshots, investments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getAllSnapshots() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return db
    .select({
      id: investmentSnapshots.id,
      snapshotDate: investmentSnapshots.snapshotDate,
      valueInCurrency: investmentSnapshots.valueInCurrency,
      valueInInr: investmentSnapshots.valueInInr,
      valueInUsd: investmentSnapshots.valueInUsd,
      exchangeRateToInr: investmentSnapshots.exchangeRateToInr,
      notes: investmentSnapshots.notes,
      investmentId: investments.id,
      investmentName: investments.name,
    })
    .from(investmentSnapshots)
    .innerJoin(investments, and(
      eq(investmentSnapshots.investmentId, investments.id),
      eq(investments.userId, userId),
    ))
    .orderBy(desc(investmentSnapshots.snapshotDate));
}

export async function getSnapshotsForInvestment(investmentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership
  const [investment] = await db
    .select()
    .from(investments)
    .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)));

  if (!investment) throw new Error('Investment not found');

  return {
    investment,
    snapshots: await db
      .select()
      .from(investmentSnapshots)
      .where(eq(investmentSnapshots.investmentId, investmentId))
      .orderBy(desc(investmentSnapshots.snapshotDate)),
  };
}
