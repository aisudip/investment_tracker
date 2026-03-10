import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investmentSnapshots, investments, accountTypes, currencies } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export type TimelineDataPoint = { date: string; totalInr: number; totalUsd: number };
export type TimelineSeries = { label: string; data: TimelineDataPoint[] };
export type GroupBy = 'total' | 'accountType' | 'currency' | 'nrType';

export async function getTimelineSeries(groupBy: GroupBy): Promise<TimelineSeries[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  switch (groupBy) {
    case 'accountType': {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          label: accountTypes.name,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
          totalUsd: sql<number>`SUM(${investmentSnapshots.valueInUsd})`,
        })
        .from(investmentSnapshots)
        .innerJoin(investments, eq(investmentSnapshots.investmentId, investments.id))
        .innerJoin(accountTypes, eq(investmentSnapshots.accountTypeId, accountTypes.id))
        .where(eq(investments.userId, userId))
        .groupBy(investmentSnapshots.snapshotDate, accountTypes.name)
        .orderBy(investmentSnapshots.snapshotDate);

      return toSeries(rows);
    }

    case 'currency': {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          label: currencies.code,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
          totalUsd: sql<number>`SUM(${investmentSnapshots.valueInUsd})`,
        })
        .from(investmentSnapshots)
        .innerJoin(investments, eq(investmentSnapshots.investmentId, investments.id))
        .innerJoin(currencies, eq(investmentSnapshots.currencyId, currencies.id))
        .where(eq(investments.userId, userId))
        .groupBy(investmentSnapshots.snapshotDate, currencies.code)
        .orderBy(investmentSnapshots.snapshotDate);

      return toSeries(rows);
    }

    case 'nrType': {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          label: investmentSnapshots.nrType,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
          totalUsd: sql<number>`SUM(${investmentSnapshots.valueInUsd})`,
        })
        .from(investmentSnapshots)
        .innerJoin(investments, eq(investmentSnapshots.investmentId, investments.id))
        .where(eq(investments.userId, userId))
        .groupBy(investmentSnapshots.snapshotDate, investmentSnapshots.nrType)
        .orderBy(investmentSnapshots.snapshotDate);

      return toSeries(rows);
    }

    default: {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
          totalUsd: sql<number>`SUM(${investmentSnapshots.valueInUsd})`,
        })
        .from(investmentSnapshots)
        .innerJoin(investments, eq(investmentSnapshots.investmentId, investments.id))
        .where(eq(investments.userId, userId))
        .groupBy(investmentSnapshots.snapshotDate)
        .orderBy(investmentSnapshots.snapshotDate);

      return [
        {
          label: 'Total',
          data: rows.map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            totalInr: Number(r.totalInr ?? 0),
            totalUsd: Number(r.totalUsd ?? 0),
          })),
        },
      ];
    }
  }
}

function toSeries(rows: { date: Date; label: string; totalInr: number; totalUsd: number }[]): TimelineSeries[] {
  const map = new Map<string, TimelineDataPoint[]>();

  for (const row of rows) {
    const pts = map.get(row.label) ?? [];
    pts.push({
      date: row.date.toISOString().slice(0, 10),
      totalInr: Number(row.totalInr ?? 0),
      totalUsd: Number(row.totalUsd ?? 0),
    });
    map.set(row.label, pts);
  }

  return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}
