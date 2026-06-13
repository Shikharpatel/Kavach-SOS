import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = sqliteTable("incidents", {
  id:                integer("id").primaryKey({ autoIncrement: true }),
  title:             text("title").notNull(),
  description:       text("description"),
  category:          text("category").notNull(),
  severity:          integer("severity").notNull().default(5),
  status:            text("status").notNull().default("active"),
  latitude:          real("latitude").notNull(),
  longitude:         real("longitude").notNull(),
  affectedPopulation: integer("affected_population").notNull().default(0),
  imageUrl:          text("image_url"),
  region:            text("region"),
  createdAt:         integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
  updatedAt:         integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
