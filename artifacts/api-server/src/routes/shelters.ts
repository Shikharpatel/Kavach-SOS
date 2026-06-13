import { Router } from "express";
import { db } from "@workspace/db";
import { sheltersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateShelterBody,
  UpdateShelterParams,
  UpdateShelterBody,
  DeleteShelterParams,
  RecommendSheltersBody,
} from "@workspace/api-zod";
import { bfsRecommendShelters } from "../algorithms/bfs.js";

const router = Router();

// GET /api/shelters
router.get("/", async (_req, res) => {
  const shelters = await db.select().from(sheltersTable);
  return res.json(shelters.map(s => ({
    ...s,
    facilities: s.facilities ?? [],
  })));
});

// POST /api/shelters
router.post("/", async (req, res) => {
  const parsed = CreateShelterBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [shelter] = await db
    .insert(sheltersTable)
    .values({ ...parsed.data, status: "available" as any })
    .returning();

  return res.status(201).json({ ...shelter, facilities: shelter.facilities ?? [] });
});

// PATCH /api/shelters/:id
router.patch("/:id", async (req, res) => {
  const params = UpdateShelterParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });

  const body = UpdateShelterBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [updated] = await db
    .update(sheltersTable)
    .set({ ...body.data, status: body.data.status as any })
    .where(eq(sheltersTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({ ...updated, facilities: updated.facilities ?? [] });
});

// DELETE /api/shelters/:id
router.delete("/:id", async (req, res) => {
  const parsed = DeleteShelterParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(sheltersTable).where(eq(sheltersTable.id, parsed.data.id));
  return res.status(204).send();
});

// POST /api/shelters/recommend  — BFS Algorithm
router.post("/recommend", async (req, res) => {
  const parsed = RecommendSheltersBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { latitude, longitude, requiredCapacity } = parsed.data;
  const shelters = await db.select().from(sheltersTable);

  const recommendations = bfsRecommendShelters(
    latitude,
    longitude,
    shelters.map(s => ({ ...s, facilities: s.facilities ?? [] })),
    requiredCapacity,
    5
  );

  return res.json(recommendations);
});

export default router;
