import { Router } from "express";
import { db } from "@workspace/db";
import { aiPredictionsTable, incidentsTable, resourcesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  AnalyzeDisasterImageBody,
  GetAiActionPlanBody,
} from "@workspace/api-zod";

const router = Router();

/**
 * AI Image Analysis Engine (Simulated CNN Pipeline)
 *
 * In production: Replace with TensorFlow/PyTorch model inference.
 * Architecture: VGG16 / ResNet50 fine-tuned on disaster imagery dataset.
 * Pipeline: Preprocess → CNN Feature Extraction → Softmax Classification → Severity Regression
 */
function simulateCNNInference(imageUrl: string): {
  category: string;
  severity: number;
  confidence: number;
  damageLevel: string;
  estimatedCasualties: number;
  priority: string;
  resources: string[];
  notes: string;
} {
  // Deterministic simulation based on URL hash for consistent results
  const seed = imageUrl.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const categories = ["flood", "earthquake", "cyclone", "fire", "landslide"];
  const category = categories[seed % categories.length];

  const severity = Math.min(10, Math.max(1, (seed % 9) + 2));
  const confidence = 0.72 + (seed % 27) / 100;
  const casualties = Math.floor(severity * (seed % 50 + 10));

  const damageLevel =
    severity <= 3 ? "minimal" :
    severity <= 5 ? "moderate" :
    severity <= 7 ? "severe" : "catastrophic";

  const priority =
    severity >= 8 ? "critical" :
    severity >= 6 ? "high" :
    severity >= 4 ? "medium" : "low";

  const resourceMap: Record<string, string[]> = {
    flood: ["boats", "water pumps", "medical kits", "food rations"],
    earthquake: ["search rescue teams", "medical units", "heavy machinery", "ambulances"],
    cyclone: ["emergency shelters", "food rations", "power generators", "medical kits"],
    fire: ["firefighting teams", "water tankers", "ambulances", "evacuation buses"],
    landslide: ["excavators", "search rescue teams", "medical units", "helicopters"],
  };

  return {
    category,
    severity,
    confidence: Math.round(confidence * 100) / 100,
    damageLevel,
    estimatedCasualties: casualties,
    priority,
    resources: resourceMap[category] ?? [],
    notes: `CNN model detected ${category} event. Confidence: ${Math.round(confidence * 100)}%. ` +
      `Estimated damage area covers ${Math.floor(seed % 50 + 5)} sq km. ` +
      `Infrastructure damage: ${damageLevel}. Immediate evacuation ${priority === "critical" ? "required" : "recommended"}.`,
  };
}

// POST /api/ai/analyze-image
router.post("/analyze-image", async (req, res) => {
  const parsed = AnalyzeDisasterImageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const inference = simulateCNNInference(parsed.data.imageUrl);

  // Save prediction log
  const incidentId = parsed.data.incidentId ?? 1;
  await db.insert(aiPredictionsTable).values({
    incidentId,
    type: "image_analysis",
    result: JSON.stringify(inference),
    confidenceScore: inference.confidence,
  });

  return res.json({
    detectedCategory: inference.category,
    severity: inference.severity,
    confidenceScore: inference.confidence,
    damageLevel: inference.damageLevel,
    estimatedCasualties: inference.estimatedCasualties,
    suggestedPriority: inference.priority,
    requiredResources: inference.resources,
    analysisNotes: inference.notes,
  });
});

// POST /api/ai/recommend-action  — AI Action Plan Generator
router.post("/recommend-action", async (req, res) => {
  const parsed = GetAiActionPlanBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { incidentId, severity, affectedPopulation, category } = parsed.data;

  // Resource demand model
  const requiredTeams = Math.max(1, Math.ceil(severity / 2));
  const shelterCapacityNeeded = Math.ceil(affectedPopulation * 0.4);
  const evacuationUrgency =
    severity >= 9 ? "immediate" :
    severity >= 7 ? "high" :
    severity >= 5 ? "moderate" : "low";

  const estimatedResponseHours = Math.max(0.5, (10 - severity) * 0.5 + affectedPopulation / 50000);

  const resources = await db.select().from(resourcesTable);
  const allocations = [
    { resourceId: 1, resourceName: "Food Supplies", category: "food", allocated: Math.ceil(affectedPopulation / 20), unit: "packets" },
    { resourceId: 2, resourceName: "Water Tanks", category: "water", allocated: Math.ceil(affectedPopulation / 50), unit: "liters" },
    { resourceId: 3, resourceName: "Medical Kits", category: "medical", allocated: Math.ceil(severity * 5), unit: "kits" },
  ].filter(a => resources.some(r => r.category === a.category));

  const notes = `AI analysis complete for ${category} incident. ` +
    `Severity ${severity}/10 with ${affectedPopulation.toLocaleString()} affected. ` +
    `Deploy ${requiredTeams} rescue teams immediately. ` +
    `Evacuation urgency: ${evacuationUrgency.toUpperCase()}. ` +
    `Estimated response time: ${estimatedResponseHours.toFixed(1)} hours. ` +
    `Recommend pre-positioning ${shelterCapacityNeeded} shelter spots.`;

  await db.insert(aiPredictionsTable).values({
    incidentId,
    type: "action_plan",
    result: notes,
    confidenceScore: 0.85,
  });

  return res.json({
    incidentId,
    requiredTeams,
    shelterCapacityNeeded,
    evacuationUrgency,
    resourcePlan: allocations,
    estimatedResponseHours: Math.round(estimatedResponseHours * 10) / 10,
    aiNotes: notes,
  });
});

// GET /api/ai/predictions
router.get("/predictions", async (_req, res) => {
  const predictions = await db
    .select()
    .from(aiPredictionsTable)
    .orderBy(desc(aiPredictionsTable.createdAt))
    .limit(50);

  return res.json(predictions.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

export default router;
