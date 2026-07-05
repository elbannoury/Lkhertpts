import { db } from './index.ts';
import { users, sessionLogs } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Helper to get or create user with robust two-layer error handling (Query Layer)
export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed inside getOrCreateUser:", error);
    throw new Error("Failed to retrieve or update user profile. Please try again later.", { cause: error });
  }
}

// Helper to create a new session log
export async function createSessionLog(userId: number, ipAddress?: string, userAgent?: string, status: string = 'success') {
  try {
    const result = await db.insert(sessionLogs)
      .values({
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        status,
        loginAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed inside createSessionLog:", error);
    throw new Error("Failed to record session log. Please try again later.", { cause: error });
  }
}

// Helper to get all session logs for a specific user
export async function getSessionLogs(userId: number) {
  try {
    return await db.select()
      .from(sessionLogs)
      .where(eq(sessionLogs.userId, userId))
      .orderBy(desc(sessionLogs.loginAt));
  } catch (error) {
    console.error("Database query failed inside getSessionLogs:", error);
    throw new Error("Failed to fetch session logs. Please try again later.", { cause: error });
  }
}

// Helper to clear session logs for a user
export async function clearSessionLogs(userId: number) {
  try {
    return await db.delete(sessionLogs)
      .where(eq(sessionLogs.userId, userId));
  } catch (error) {
    console.error("Database query failed inside clearSessionLogs:", error);
    throw new Error("Failed to clear session logs. Please try again later.", { cause: error });
  }
}
