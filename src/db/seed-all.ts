/**
 * Full reset + seed script.
 * Truncates all tables in FK-safe order, then re-inserts all data.
 * Run AFTER `npm run db:push` so the schema matches.
 */
import 'dotenv/config';
import { db } from './index';
import {
  investmentSnapshots, investments, banks,
  accountTypes, currencies,
} from './schema';
import { sql } from 'drizzle-orm';

const USER_ID = 'user_demo';

// ── Helpers ───────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function monthRange(sy: number, sm: number, ey: number, em: number): Date[] {
  const dates: Date[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    dates.push(new Date(y, m - 1, 1));
    if (++m > 12) { m = 1; y++; }
  }
  return dates;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {

  // ── Step 1: Truncate in FK-safe order (children first) ───────────────────
  console.log('Truncating tables...');
  await db.execute(sql`TRUNCATE investment_snapshots, investments, banks, account_types, currencies RESTART IDENTITY CASCADE`);
  console.log('  ✓ All tables cleared');

  // ── Step 2: Lookup tables ─────────────────────────────────────────────────
  console.log('\nSeeding account_types...');
  const atRows = await db.insert(accountTypes).values([
    { name: 'Savings',     description: 'Savings bank account' },
    { name: 'FD',          description: 'Fixed deposit' },
    { name: 'Real Estate', description: 'Property and real estate investments' },
    { name: 'Card',        description: 'Credit or debit card balances' },
    { name: 'MF',          description: 'Mutual funds' },
    { name: 'Insurance',   description: 'Life or investment insurance policies' },
    { name: 'PPF',         description: 'Public Provident Fund' },
    { name: 'NPS',         description: 'National Pension System' },
    { name: 'Stocks',      description: 'Direct equity / stocks' },
    { name: 'Crypto',      description: 'Cryptocurrency holdings' },
    { name: 'Other',       description: 'Other investment types' },
  ]).returning();
  const at = Object.fromEntries(atRows.map((r) => [r.name, r.id]));
  console.log(`  ✓ ${atRows.length} account types`);

  console.log('Seeding currencies...');
  const ccRows = await db.insert(currencies).values([
    { code: 'INR', name: 'Indian Rupee',       symbol: '₹' },
    { code: 'USD', name: 'US Dollar',           symbol: '$' },
    { code: 'EUR', name: 'Euro',                symbol: '€' },
    { code: 'GBP', name: 'British Pound',       symbol: '£' },
    { code: 'AED', name: 'UAE Dirham',          symbol: 'د.إ' },
    { code: 'SGD', name: 'Singapore Dollar',    symbol: 'S$' },
  ]).returning();
  const cc = Object.fromEntries(ccRows.map((r) => [r.code, r.id]));
  console.log(`  ✓ ${ccRows.length} currencies`);

  // ── Step 3: Investments ───────────────────────────────────────────────────
  console.log('\nSeeding investments...');
  const invRows = await db.insert(investments).values([
    {
      userId: USER_ID,
      name: 'SBI Savings Account',
      accountTypeId: at['Savings'],
      currencyId: cc['INR'],
      nrType: 'NRO',
    },
    {
      userId: USER_ID,
      name: 'HDFC Fixed Deposit',
      accountTypeId: at['FD'],
      currencyId: cc['INR'],
      nrType: 'NRO',
    },
    {
      userId: USER_ID,
      name: 'Vanguard S&P 500 ETF',
      accountTypeId: at['MF'],
      currencyId: cc['USD'],
      nrType: 'NRE',
      usdAvailability: true,
    },
    {
      userId: USER_ID,
      name: 'PPF Account',
      accountTypeId: at['PPF'],
      currencyId: cc['INR'],
      nrType: 'NA',
    },
    {
      userId: USER_ID,
      name: 'Zerodha Equity Portfolio',
      accountTypeId: at['Stocks'],
      currencyId: cc['INR'],
      nrType: 'NA',
    },
  ]).returning();
  const inv = Object.fromEntries(invRows.map((r) => [r.name, r]));
  console.log(`  ✓ ${invRows.length} investments`);

  // ── Step 4: Snapshots ─────────────────────────────────────────────────────
  console.log('\nBuilding snapshots (Aug 2024 → Mar 2026)...');

  const dates = monthRange(2024, 8, 2026, 3);
  const N = dates.length;
  const usdInr = (t: number) => lerp(83.5, 87.5, t);

  type Row = typeof investmentSnapshots.$inferInsert;
  const rows: Row[] = [];

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const date = dates[i];

    // SBI Savings — steady growth ₹5L → ₹6.3L, small dip month 7
    {
      const p = inv['SBI Savings Account'];
      const v = lerp(500_000, 630_000, t) + (i === 7 ? -12_000 : 0);
      rows.push({
        investmentId: p.id, snapshotDate: date,
        valueInCurrency: v.toFixed(4),
        valueInInr:      v.toFixed(4),
        valueInUsd:      (v / usdInr(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInr(t)).toFixed(6),
        accountTypeId: p.accountTypeId, currencyId: p.currencyId, nrType: p.nrType,
      });
    }

    // HDFC FD — compound interest 7.5% pa from ₹10L
    {
      const p = inv['HDFC Fixed Deposit'];
      const v = 1_000_000 * Math.pow(1 + 0.075 / 12, i);
      rows.push({
        investmentId: p.id, snapshotDate: date,
        valueInCurrency: v.toFixed(4),
        valueInInr:      v.toFixed(4),
        valueInUsd:      (v / usdInr(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInr(t)).toFixed(6),
        accountTypeId: p.accountTypeId, currencyId: p.currencyId, nrType: p.nrType,
      });
    }

    // Vanguard ETF — USD equity $8K → $13K with a mid-period dip
    {
      const p = inv['Vanguard S&P 500 ETF'];
      const dip = (i >= 10 && i <= 12) ? -800 * Math.sin(((i - 10) / 2) * Math.PI) : 0;
      const vUsd = lerp(8_000, 13_000, t) + dip;
      const vInr = vUsd * usdInr(t);
      rows.push({
        investmentId: p.id, snapshotDate: date,
        valueInCurrency: vUsd.toFixed(4),
        valueInInr:      vInr.toFixed(4),
        valueInUsd:      vUsd.toFixed(4),
        exchangeRateToInr: usdInr(t).toFixed(6),
        exchangeRateToUsd: '1.000000',
        accountTypeId: p.accountTypeId, currencyId: p.currencyId, nrType: p.nrType,
      });
    }

    // PPF — ₹12.5K/mo contributions at 8.25% pa from base ₹8L
    {
      const p = inv['PPF Account'];
      const r = 0.0825 / 12;
      const v = 800_000 * Math.pow(1 + r, i)
              + 12_500 * ((Math.pow(1 + r, i) - 1) / r);
      rows.push({
        investmentId: p.id, snapshotDate: date,
        valueInCurrency: v.toFixed(4),
        valueInInr:      v.toFixed(4),
        valueInUsd:      (v / usdInr(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInr(t)).toFixed(6),
        accountTypeId: p.accountTypeId, currencyId: p.currencyId, nrType: p.nrType,
      });
    }

    // Zerodha — equity ₹12L → ₹22L, two corrections
    {
      const p = inv['Zerodha Equity Portfolio'];
      const c1 = (i >= 5  && i <= 7)  ? -120_000 * Math.sin(((i - 5)  / 2) * Math.PI) : 0;
      const c2 = (i >= 14 && i <= 15) ?  -90_000 * Math.sin(((i - 14) / 1) * Math.PI) : 0;
      const v = lerp(1_200_000, 2_200_000, t) + c1 + c2;
      rows.push({
        investmentId: p.id, snapshotDate: date,
        valueInCurrency: v.toFixed(4),
        valueInInr:      v.toFixed(4),
        valueInUsd:      (v / usdInr(t)).toFixed(4),
        exchangeRateToInr: '1.000000',
        exchangeRateToUsd: (1 / usdInr(t)).toFixed(6),
        accountTypeId: p.accountTypeId, currencyId: p.currencyId, nrType: p.nrType,
      });
    }
  }

  console.log(`  Inserting ${rows.length} snapshot rows...`);
  await db.insert(investmentSnapshots).values(rows);
  console.log(`  ✓ ${rows.length} snapshots inserted`);

  console.log('\nAll done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
