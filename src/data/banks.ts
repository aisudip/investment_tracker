import { auth } from '@/lib/auth';
import { db } from '@/db';
import { banks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type BankData = {
  name: string;
  branch?: string;
  ifsc?: string;
  swiftCode?: string;
  address?: string;
  rmName?: string;
  rmEmail?: string;
  rmPhone?: string;
};

export async function createBank(data: BankData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [bank] = await db
    .insert(banks)
    .values({ ...data, userId })
    .returning();
  return bank;
}

export async function updateBank(id: number, data: Partial<BankData>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [bank] = await db
    .update(banks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(banks.id, id), eq(banks.userId, userId)))
    .returning();
  return bank;
}

export async function deleteBank(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db
    .delete(banks)
    .where(and(eq(banks.id, id), eq(banks.userId, userId)));
}

export async function createBanksFromCsv(rows: BankData[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  if (rows.length === 0) return [];

  return db
    .insert(banks)
    .values(rows.map((row) => ({ ...row, userId })))
    .returning();
}
