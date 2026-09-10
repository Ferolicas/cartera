import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "settled",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    description: varchar("description", { length: 160 }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    type: transactionType("type").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: transactionStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("transactions_amount_positive", sql`${table.amountCents} > 0`),
    index("transactions_due_date_idx").on(table.dueDate),
    index("transactions_type_status_idx").on(table.type, table.status),
  ],
);

export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    currentBalanceCents: integer("current_balance_cents").default(0).notNull(),
    currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);

export type Transaction = typeof transactions.$inferSelect;
