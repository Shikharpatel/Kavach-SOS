import { Router } from "express";
import { db } from "@workspace/db";
import { rescueTeamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateRescueTeamBody,
  UpdateRescueTeamParams,
  UpdateRescueTeamBody,
} from "@workspace/api-zod";

const router = Router();

// GET /api/rescue-teams
router.get("/", async (_req, res) => {
  const teams = await db.select().from(rescueTeamsTable);
  return res.json(teams.map(t => ({
    ...t,
    equipment: t.equipment ?? [],
    assignedIncidentId: t.assignedIncidentId ?? null,
  })));
});

// POST /api/rescue-teams
router.post("/", async (req, res) => {
  const parsed = CreateRescueTeamBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const [team] = await db
    .insert(rescueTeamsTable)
    .values({
      ...parsed.data,
      type: parsed.data.type as any,
      status: "available" as any,
    })
    .returning();

  return res.status(201).json({ ...team, equipment: team.equipment ?? [] });
});

// PATCH /api/rescue-teams/:id
router.patch("/:id", async (req, res) => {
  const params = UpdateRescueTeamParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });

  const body = UpdateRescueTeamBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.message });

  const [updated] = await db
    .update(rescueTeamsTable)
    .set({ ...body.data, status: body.data.status as any })
    .where(eq(rescueTeamsTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({ ...updated, equipment: updated.equipment ?? [], assignedIncidentId: updated.assignedIncidentId ?? null });
});

export default router;
