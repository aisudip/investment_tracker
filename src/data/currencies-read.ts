import { db } from '@/db';
import { currencies } from '@/db/schema';

export async function getCurrencies() {
  return db.select().from(currencies);
}
