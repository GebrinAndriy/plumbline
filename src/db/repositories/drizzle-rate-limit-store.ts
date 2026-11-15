import { sql } from "drizzle-orm";
import type { RateLimitStore } from "@/domain/rate-limit/rate-limit";
import type { Database } from "../database";
import { rateLimits } from "../schema";

export function createDrizzleRateLimitStore(db: Database): RateLimitStore {
  return {
    async increment(key, windowStart) {
      // A single upsert, so parallel requests cannot both read the old count.
      const [row] = await db
        .insert(rateLimits)
        .values({ key, windowStart, hits: 1 })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            hits: sql`case when ${rateLimits.windowStart} = excluded.window_start then ${rateLimits.hits} + 1 else 1 end`,
            windowStart: sql`excluded.window_start`,
          },
        })
        .returning({ hits: rateLimits.hits });
      return row.hits;
    },
  };
}
