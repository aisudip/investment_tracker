import { db } from './index';
import { accountTypes, currencies } from './schema';

async function seed() {
  console.log('Seeding lookup tables...');

  await db.insert(accountTypes).values([
    { name: 'Savings', description: 'Savings bank account' },
    { name: 'FD', description: 'Fixed deposit' },
    { name: 'Real Estate', description: 'Property and real estate investments' },
    { name: 'Card', description: 'Credit or debit card balances' },
    { name: 'MF', description: 'Mutual funds' },
    { name: 'Insurance', description: 'Life or investment insurance policies' },
    { name: 'PPF', description: 'Public Provident Fund' },
    { name: 'NPS', description: 'National Pension System' },
    { name: 'Stocks', description: 'Direct equity / stocks' },
    { name: 'Crypto', description: 'Cryptocurrency holdings' },
    { name: 'Other', description: 'Other investment types' },
  ]).onConflictDoNothing();

  await db.insert(currencies).values([
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  ]).onConflictDoNothing();

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
