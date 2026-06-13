import { Router } from "express";
import { db } from "@workspace/db";
import { resourcesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateResourceBody,
  UpdateResourceParams,
  UpdateResourceBody,
  AllocateResourcesBody,
} from "@workspace/api-zod";
import { greedyAllocate } from "../algorithms/greedy.js";

const router = Router();

// GET /api/resources
router.get("/", async (_req, res) => {
  const resources = await db.select().from(resourcesTable);
  return res.json(resources);
});

// POST /api/resources
router.post("/", async (req, res) => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [resource] = await db
    .insert(resourcesTable)
    .values({ ...parsed.data, category: parsed.data.category as any })
    .returning();

  return res.status(201).json(resource);
});

// PATCH /api/resources/:id
router.patch("/:id", async (req, res) => {
  const params = UpdateResourceParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });

  const body = UpdateResourceBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [updated] = await db
    .update(resourcesTable)
    .set(body.data)
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

// POST /api/resources/allocate  — Greedy Algorithm
router.post("/allocate", async (req, res) => {
  const parsed = AllocateResourcesBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { incidentId, severity, affectedPopulation } = parsed.data;
  const resources = await db.select().from(resourcesTable);

  const result = greedyAllocate(resources, severity, affectedPopulation);

  // Persist inventory changes — decrement availableQuantity for each allocated resource
  for (const allocation of result.allocations) {
    await db
      .update(resourcesTable)
      .set({
        availableQuantity: sql`GREATEST(0, ${resourcesTable.availableQuantity} - ${allocation.allocated})`,
      })
      .where(eq(resourcesTable.id, allocation.resourceId));
  }

  return res.json({
    incidentId,
    allocations: result.allocations,
    shortages: result.shortages,
  });
});

// GET /api/resources/stats/utilization
router.get("/stats/utilization", async (_req, res) => {
  const resources = await db.select().from(resourcesTable);

  const byCategory = new Map<string, { total: number; available: number }>();
  for (const r of resources) {
    const existing = byCategory.get(r.category) ?? { total: 0, available: 0 };
    byCategory.set(r.category, {
      total: existing.total + r.totalQuantity,
      available: existing.available + r.availableQuantity,
    });
  }

  return res.json(
    [...byCategory.entries()].map(([category, data]) => ({
      category,
      total: data.total,
      used: data.total - data.available,
      available: data.available,
      utilizationPct: data.total > 0
        ? Math.round(((data.total - data.available) / data.total) * 1000) / 10
        : 0,
    }))
  );
});

export default router;
