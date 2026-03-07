import {
  pgTable, pgEnum, serial, uuid, varchar, text,
  boolean, integer, numeric, date, timestamp,
  uniqueIndex, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enum ─────────────────────────────────────────────────────────────────────
export const nrTypeEnum = pgEnum('nr_type', ['NRO', 'NRE', 'NA']);

// ─── Lookup Tables ────────────────────────────────────────────────────────────
export const accountTypes = pgTable('account_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const currencies = pgTable('currencies', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 50 }),
  symbol: varchar('symbol', { length: 5 }),
});

// ─── Banks ────────────────────────────────────────────────────────────────────
export const banks = pgTable('banks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  branch: varchar('branch', { length: 150 }),
  ifsc: varchar('ifsc', { length: 20 }),
  swiftCode: varchar('swift_code', { length: 20 }),
  address: text('address'),
  rmName: varchar('rm_name', { length: 150 }),
  rmEmail: varchar('rm_email', { length: 255 }),
  rmPhone: varchar('rm_phone', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('banks_user_id_idx').on(table.userId),
  uniqueIndex('banks_user_ifsc_unique_idx').on(table.userId, table.ifsc),
]);

// ─── Investments ──────────────────────────────────────────────────────────────
export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  accountTypeId: integer('account_type_id').notNull().references(() => accountTypes.id),
  currencyId: integer('currency_id').notNull().references(() => currencies.id),
  nrType: nrTypeEnum('nr_type').notNull().default('NA'),
  usdAvailability: boolean('usd_availability').notNull().default(false),
  bankId: integer('bank_id').references(() => banks.id, { onDelete: 'set null' }),
  accountNumber: varchar('account_number', { length: 50 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('investments_user_id_idx').on(table.userId),
  index('investments_user_account_type_idx').on(table.userId, table.accountTypeId),
  index('investments_user_currency_idx').on(table.userId, table.currencyId),
  index('investments_user_nr_type_idx').on(table.userId, table.nrType),
]);

// ─── Investment Snapshots ─────────────────────────────────────────────────────
export const investmentSnapshots = pgTable('investment_snapshots', {
  id: serial('id').primaryKey(),
  investmentId: uuid('investment_id').notNull().references(() => investments.id, { onDelete: 'cascade' }),
  snapshotDate: date('snapshot_date', { mode: 'date' }).notNull(),
  valueInCurrency: numeric('value_in_currency', { precision: 18, scale: 4 }).notNull(),
  valueInInr: numeric('value_in_inr', { precision: 18, scale: 4 }),
  valueInUsd: numeric('value_in_usd', { precision: 18, scale: 4 }),
  exchangeRateToInr: numeric('exchange_rate_to_inr', { precision: 12, scale: 6 }),
  exchangeRateToUsd: numeric('exchange_rate_to_usd', { precision: 12, scale: 6 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('snapshots_investment_date_unique_idx').on(table.investmentId, table.snapshotDate),
  index('snapshots_investment_date_idx').on(table.investmentId, table.snapshotDate),
  index('snapshots_date_idx').on(table.snapshotDate),
]);

// ─── Relations ────────────────────────────────────────────────────────────────
export const accountTypesRelations = relations(accountTypes, ({ many }) => ({
  investments: many(investments),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  investments: many(investments),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  accountType: one(accountTypes, { fields: [investments.accountTypeId], references: [accountTypes.id] }),
  currency: one(currencies, { fields: [investments.currencyId], references: [currencies.id] }),
  bank: one(banks, { fields: [investments.bankId], references: [banks.id] }),
  snapshots: many(investmentSnapshots),
}));

export const investmentSnapshotsRelations = relations(investmentSnapshots, ({ one }) => ({
  investment: one(investments, { fields: [investmentSnapshots.investmentId], references: [investments.id] }),
}));
