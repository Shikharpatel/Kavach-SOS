import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiPredictionsTable = sqliteTable("ai_predictions", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  incidentId:      integer("incident_id").notNull(),
  type:            text("type").notNull(),
  result:          text("result").notNull(),
  confidenceScore: real("confidence_score").notNull().default(0),
  createdAt:       integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
});

export const insertAiPredictionSchema = createInsertSchema(aiPredictionsTable).omit({ id: true, createdAt: true });
export type InsertAiPrediction = z.infer<typeof insertAiPredictionSchema>;
export type AiPrediction = typeof aiPredictionsTable.$inferSelect;
