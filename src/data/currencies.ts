import { db } from '@/db';
import { currencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function createCurrency(data: { code: string; name?: string; symbol?: string }) {
  const [row] = await db.insert(currencies).values(data).returning();
  return row;
}

export async function updateCurrency(id: number, data: { code?: string; name?: string; symbol?: string }) {
  const [row] = await db.update(currencies).set(data).where(eq(currencies.id, id)).returning();
  return row;
}

export async function deleteCurrency(id: number) {
  await db.delete(currencies).where(eq(currencies.id, id));
}
