import { db } from '@/db';
import { accountTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createAccountType(data: { name: string; description?: string }) {
  const [row] = await db.insert(accountTypes).values(data).returning();
  return row;
}

export async function updateAccountType(id: number, data: { name?: string; description?: string }) {
  const [row] = await db.update(accountTypes).set(data).where(eq(accountTypes.id, id)).returning();
  return row;
}

export async function deleteAccountType(id: number) {
  await db.delete(accountTypes).where(eq(accountTypes.id, id));
}
