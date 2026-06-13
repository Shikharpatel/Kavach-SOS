import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourcesTable = sqliteTable("resources", {
  id:                integer("id").primaryKey({ autoIncrement: true }),
  name:              text("name").notNull(),
  category:          text("category").notNull(),
  totalQuantity:     integer("total_quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  unit:              text("unit").notNull().default("units"),
  location:          text("location").notNull(),
  latitude:          real("latitude"),
  longitude:         real("longitude"),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
