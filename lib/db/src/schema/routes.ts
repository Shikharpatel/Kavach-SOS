import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rescueRoutesTable = sqliteTable("rescue_routes", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  teamId:           integer("team_id").notNull(),
  incidentId:       integer("incident_id").notNull(),
  totalDistanceKm:  real("total_distance_km").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  status:           text("status").notNull().default("planned"),
  safetyScore:      real("safety_score").notNull().default(85),
  createdAt:        integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertRescueRouteSchema = createInsertSchema(rescueRoutesTable).omit({ id: true, createdAt: true });
export type InsertRescueRoute = z.infer<typeof insertRescueRouteSchema>;
export type RescueRoute = typeof rescueRoutesTable.$inferSelect;
