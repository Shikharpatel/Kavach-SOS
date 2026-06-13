import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rescueTeamsTable = sqliteTable("rescue_teams", {
  id:                 integer("id").primaryKey({ autoIncrement: true }),
  name:               text("name").notNull(),
  type:               text("type").notNull(),
  size:               integer("size").notNull().default(5),
  status:             text("status").notNull().default("available"),
  latitude:           real("latitude").notNull(),
  longitude:          real("longitude").notNull(),
  assignedIncidentId: integer("assigned_incident_id"),
  equipment:          text("equipment", { mode: "json" }).$type<string[]>(),
});

export const insertRescueTeamSchema = createInsertSchema(rescueTeamsTable).omit({ id: true });
export type InsertRescueTeam = z.infer<typeof insertRescueTeamSchema>;
export type RescueTeam = typeof rescueTeamsTable.$inferSelect;
