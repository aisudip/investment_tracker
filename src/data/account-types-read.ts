import { db } from '@/db';
import { accountTypes } from '@/db/schema';

export async function getAccountTypes() {
  return db.select().from(accountTypes);
}
