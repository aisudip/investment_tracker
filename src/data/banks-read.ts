import { auth } from '@/lib/auth';
import { db } from '@/db';
import { banks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserBanks() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return db.select().from(banks).where(eq(banks.userId, userId));
}
