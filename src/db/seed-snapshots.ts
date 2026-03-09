import { db } from './index';
import {
  accountTypes, currencies, investments, investmentSnapshots,
} from './schema';

const USER_ID = 'user_demo';

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns the first day of each month from startYear/startMonth to endYear/endMonth inclusive. */
function monthRange(
  startYear: number, startMonth: number,
  endYear: number,   endMonth: number,
): Date[] {
  const dates: Date[] = [];
  let y = startYear, m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    dates.push(new Date(y, m - 1, 1));
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return dates;
}

/** Linear interpolation from `a` to `b` at position `t ∈ [0,1]`. */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seedSnapshots() {
  console.log('Looking up account types and currencies...');

  // Fetch lookup rows by name so we're not relying on hardcoded serial IDs
  const atRows = await db.select().from(accountTypes);
  const ccRows = await db.select().from(currencies);

  const at = Object.fromEntries(atRows.map((r) => [r.name, r.id]));
  const cc = Object.fromEntries(ccRows.map((r) => [r.code, r.id]));

  // ── 1. Insert investments ─────────────────────────────────────────────────

  console.log('Inserting investments...');

  const inserted = await db
    .insert(investments)
    .values([
      {
        userId: USER_ID,
        name: 'SBI Savings Account',
        accountTypeId: at['Savings'],
        currencyId: cc['INR'],
        nrType: 'NRO',
        isActive: true,
      },
      {
        userId: USER_ID,
        name: 'HDFC Fixed Deposit',
        accountTypeId: at['FD'],
        currencyId: cc['INR'],
        nrType: 'NRO',
        isActive: true,
      },
      {
        userId: USER_ID,
        name: 'Vanguard S&P 500 ETF',
        accountTypeId: at['MF'],
        currencyId: cc['USD'],
        nrType: 'NRE',
        usdAvailability: true,
        isActive: true,
      },
      {
        userId: USER_ID,
        name: 'PPF Account',
        accountTypeId: at['PPF'],
        currencyId: cc['INR'],
        nrType: 'NA',
        isActive: true,
      },
      {
        userId: USER_ID,
        name: 'Zerodha Equity Portfolio',
        accountTypeId: at['Stocks'],
        currencyId: cc['INR'],
        nrType: 'NA',
        isActive: true,
      },
    ])
    .returning();

  const inv = Object.fromEntries(inserted.map((r) => [r.name, r]));

  // ── 2. Build snapshots ────────────────────────────────────────────────────

  // 20 months: Aug 2024 → Mar 2026
  const dates = monthRange(2024, 8, 2026, 3);
  const N = dates.length;

  console.log(`Generating ${N} monthly snapshots per investment...`);

  // USD/INR rate: gently rises from 83.5 → 87.5 over the period
  const usdInrRate = (t: number) => lerp(83.5, 87.5, t);


  type SnapshotInsert = typeof investmentSnapshots.$inferInsert;
  const rows: SnapshotInsert[] = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const date = dates[i];

    // ── SBI Savings (INR, NRO) ────────────────────────────────────────────
    // Grows steadily from 5L to 6.3L with a small dip in Mar 2025
    {
      const inv_ = inv['SBI Savings Account'];
      const base = lerp(500_000, 630_000, t);
      const dip = i === 7 ? -12_000 : 0; // small withdrawal in Mar 2025
      const value = base + dip;
      rows.push({
        investmentId: inv_.id,
        snapshotDate: date,
        valueInCurrency: value.toFixed(4),
        valueInInr: value.toFixed(4),
        valueInUsd: (value / usdInrRate(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInrRate(t)).toFixed(6),
        accountTypeId: inv_.accountTypeId,
        currencyId: inv_.currencyId,
        nrType: inv_.nrType,
      });
    }

    // ── HDFC Fixed Deposit (INR, NRO) ─────────────────────────────────────
    // Compounds at ~7.5% pa from 10L → ~13.3L
    {
      const inv_ = inv['HDFC Fixed Deposit'];
      const value = 1_000_000 * Math.pow(1 + 0.075 / 12, i);
      rows.push({
        investmentId: inv_.id,
        snapshotDate: date,
        valueInCurrency: value.toFixed(4),
        valueInInr: value.toFixed(4),
        valueInUsd: (value / usdInrRate(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInrRate(t)).toFixed(6),
        accountTypeId: inv_.accountTypeId,
        currencyId: inv_.currencyId,
        nrType: inv_.nrType,
      });
    }

    // ── Vanguard S&P 500 ETF (USD, NRE) ──────────────────────────────────
    // Equity growth with volatility: ~$8K → ~$13K with a dip around month 10-11
    {
      const inv_ = inv['Vanguard S&P 500 ETF'];
      const trend = lerp(8_000, 13_000, t);
      // Simulate a correction dip mid-way (months 10-12 = Jun-Aug 2025)
      const dip =
        i >= 10 && i <= 12
          ? -800 * Math.sin(((i - 10) / 2) * Math.PI)
          : 0;
      const valueUsd = trend + dip;
      const valueInr = valueUsd * usdInrRate(t);
      rows.push({
        investmentId: inv_.id,
        snapshotDate: date,
        valueInCurrency: valueUsd.toFixed(4),
        valueInInr: valueInr.toFixed(4),
        valueInUsd: valueUsd.toFixed(4),
        exchangeRateToInr: usdInrRate(t).toFixed(6),
        exchangeRateToUsd: '1.000000',
        accountTypeId: inv_.accountTypeId,
        currencyId: inv_.currencyId,
        nrType: inv_.nrType,
      });
    }

    // ── PPF Account (INR, NA) ─────────────────────────────────────────────
    // Monthly contributions of ₹12,500 + 8.25% pa interest
    // Starts at 8L, grows to ~11L
    {
      const inv_ = inv['PPF Account'];
      const monthlyContrib = 12_500;
      const monthlyRate = 0.0825 / 12;
      // Simple future value of growing annuity from base 8L
      let value = 800_000 * Math.pow(1 + monthlyRate, i);
      value += monthlyContrib * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate);
      rows.push({
        investmentId: inv_.id,
        snapshotDate: date,
        valueInCurrency: value.toFixed(4),
        valueInInr: value.toFixed(4),
        valueInUsd: (value / usdInrRate(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInrRate(t)).toFixed(6),
        accountTypeId: inv_.accountTypeId,
        currencyId: inv_.currencyId,
        nrType: inv_.nrType,
      });
    }

    // ── Zerodha Equity Portfolio (INR, NA) ────────────────────────────────
    // High-volatility equity: ~12L → ~22L with two corrections
    {
      const inv_ = inv['Zerodha Equity Portfolio'];
      const trend = lerp(1_200_000, 2_200_000, t);
      // Correction 1: months 5-7 (Jan-Mar 2025), Correction 2: months 14-15 (Oct-Nov 2025)
      const corr1 =
        i >= 5 && i <= 7
          ? -120_000 * Math.sin(((i - 5) / 2) * Math.PI)
          : 0;
      const corr2 =
        i >= 14 && i <= 15
          ? -90_000 * Math.sin(((i - 14) / 1) * Math.PI)
          : 0;
      const value = trend + corr1 + corr2;
      rows.push({
        investmentId: inv_.id,
        snapshotDate: date,
        valueInCurrency: value.toFixed(4),
        valueInInr: value.toFixed(4),
        valueInUsd: (value / usdInrRate(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInrRate(t)).toFixed(6),
        accountTypeId: inv_.accountTypeId,
        currencyId: inv_.currencyId,
        nrType: inv_.nrType,
      });
    }
  }

  // Insert in one batch
  await db.insert(investmentSnapshots).values(rows).onConflictDoNothing();

  console.log(`Inserted ${rows.length} snapshots (${N} dates × 5 investments).`);
  console.log('Done.');
  process.exit(0);
}

seedSnapshots().catch((err) => {
  console.error('Snapshot seed failed:', err);
  process.exit(1);
});
