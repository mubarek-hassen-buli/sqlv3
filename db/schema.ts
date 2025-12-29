import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // NextAuth User ID (usually string)
  name: text('name'),
  email: text('email').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const diagrams = pgTable('diagrams', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull().default('Untitled Diagram'),
  sql: text('sql').notNull(),
  layout: jsonb('layout'), // Store the computed ELK layout
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
