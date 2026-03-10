import { auth } from '@/lib/auth';
import { db } from '@/db';
import { investments, banks, accountTypes, currencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserInvestments() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return db
    .select({
      id: investments.id,
      name: investments.name,
      isActive: investments.isActive,
      nrType: investments.nrType,
      usdAvailability: investments.usdAvailability,
      accountNumber: investments.accountNumber,
      notes: investments.notes,
      accountType: accountTypes.name,
      currencyCode: currencies.code,
      bankName: banks.name,
      createdAt: investments.createdAt,
    })
    .from(investments)
    .leftJoin(accountTypes, eq(investments.accountTypeId, accountTypes.id))
    .leftJoin(currencies, eq(investments.currencyId, currencies.id))
    .leftJoin(banks, eq(investments.bankId, banks.id))
    .where(eq(investments.userId, userId));
}

export async function getAccountTypes() {
  return db.select().from(accountTypes);
}

export async function getCurrencies() {
  return db.select().from(currencies);
}
