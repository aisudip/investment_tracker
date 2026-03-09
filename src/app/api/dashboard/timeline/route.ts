import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { investmentSnapshots, accountTypes, currencies } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';

export type TimelineDataPoint = { date: string; totalInr: number };
export type TimelineSeries = { label: string; data: TimelineDataPoint[] };

export type GroupBy = 'total' | 'accountType' | 'currency' | 'nrType';

export async function GET(req: NextRequest) {
  const groupBy = (req.nextUrl.searchParams.get('groupBy') ?? 'total') as GroupBy;

  const series = await fetchSeries(groupBy);
  return NextResponse.json(series);
}

export async function fetchSeries(groupBy: GroupBy): Promise<TimelineSeries[]> {
  switch (groupBy) {
    case 'accountType': {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          label: accountTypes.name,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
        })
        .from(investmentSnapshots)
        .innerJoin(accountTypes, eq(investmentSnapshots.accountTypeId, accountTypes.id))
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
        })
        .from(investmentSnapshots)
        .innerJoin(currencies, eq(investmentSnapshots.currencyId, currencies.id))
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
        })
        .from(investmentSnapshots)
        .groupBy(investmentSnapshots.snapshotDate, investmentSnapshots.nrType)
        .orderBy(investmentSnapshots.snapshotDate);

      return toSeries(rows);
    }

    default: {
      const rows = await db
        .select({
          date: investmentSnapshots.snapshotDate,
          totalInr: sql<number>`SUM(${investmentSnapshots.valueInInr})`,
        })
        .from(investmentSnapshots)
        .groupBy(investmentSnapshots.snapshotDate)
        .orderBy(investmentSnapshots.snapshotDate);

      return [
        {
          label: 'Total',
          data: rows.map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            totalInr: Number(r.totalInr ?? 0),
          })),
        },
      ];
    }
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toSeries(rows: { date: Date; label: string; totalInr: number }[]): TimelineSeries[] {
  const map = new Map<string, TimelineDataPoint[]>();

  for (const row of rows) {
    const pts = map.get(row.label) ?? [];
    pts.push({ date: row.date.toISOString().slice(0, 10), totalInr: Number(row.totalInr ?? 0) });
    map.set(row.label, pts);
  }

  return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}
