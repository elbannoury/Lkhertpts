import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'session_logs' table
export const sessionLogs = pgTable('session_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  loginAt: timestamp('login_at').defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').default('success'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  sessionLogs: many(sessionLogs),
}));

// Define relationships for the 'session_logs' table
export const sessionLogsRelations = relations(sessionLogs, ({ one }) => ({
  user: one(users, {
    fields: [sessionLogs.userId],
    references: [users.id],
  }),
}));
