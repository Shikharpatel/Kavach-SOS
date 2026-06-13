import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sheltersTable = sqliteTable("shelters", {
  id:               integer("id").primaryKey({ autoIncrement: true }),
  name:             text("name").notNull(),
  latitude:         real("latitude").notNull(),
  longitude:        real("longitude").notNull(),
  capacity:         integer("capacity").notNull().default(0),
  currentOccupancy: integer("current_occupancy").notNull().default(0),
  status:           text("status").notNull().default("available"),
  address:          text("address"),
  facilities:       text("facilities", { mode: "json" }).$type<string[]>(),
});

export const insertShelterSchema = createInsertSchema(sheltersTable).omit({ id: true });
export type InsertShelter = z.infer<typeof insertShelterSchema>;
export type Shelter = typeof sheltersTable.$inferSelect;
