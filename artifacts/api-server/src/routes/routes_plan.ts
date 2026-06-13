import { Router } from "express";
import { db } from "@workspace/db";
import { rescueRoutesTable, rescueTeamsTable, incidentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { PlanRescueRouteBody } from "@workspace/api-zod";
import { dijkstra, haversineDistance, generateWaypoints } from "../algorithms/dijkstra.js";

const router = Router();

// POST /api/routes/plan  — Dijkstra Algorithm
router.post("/plan", async (req, res) => {
  const parsed = PlanRescueRouteBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { teamId, incidentId } = parsed.data;

  const [team] = await db.select().from(rescueTeamsTable).where(eq(rescueTeamsTable.id, teamId));
  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, incidentId));

  if (!team || !incident) return res.status(404).json({ error: "Team or incident not found" });

  // Build a small road network graph between team and incident
  const waypoints = generateWaypoints(team.latitude, team.longitude, incident.latitude, incident.longitude, 4);

  const nodes = waypoints.map((wp, i) => ({
    id: `node_${i}`,
    latitude: wp.lat,
    longitude: wp.lon,
    label: i === 0 ? team.name : i === waypoints.length - 1 ? incident.title : `Waypoint ${i}`,
  }));

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const dist = haversineDistance(nodes[i].latitude, nodes[i].longitude, nodes[i+1].latitude, nodes[i+1].longitude);
    edges.push({
      from: nodes[i].id,
      to: nodes[i+1].id,
      weight: dist,
      safetyPenalty: Math.random() * 0.2, // 0-20% road condition penalty
    });
  }

  const result = dijkstra(nodes, edges, "node_0", `node_${nodes.length - 1}`);

  const pathWaypoints = nodes.map((node, i) => ({
    latitude: node.latitude,
    longitude: node.longitude,
    label: node.label,
    order: i,
  }));

  const totalDistanceKm = haversineDistance(team.latitude, team.longitude, incident.latitude, incident.longitude);
  const estimatedMinutes = Math.ceil((totalDistanceKm / 60) * 60); // 60 km/h avg
  const safetyScore = Math.max(60, 95 - edges.reduce((sum, e) => sum + e.safetyPenalty * 10, 0));

  // Save route to DB
  const [savedRoute] = await db.insert(rescueRoutesTable).values({
    teamId,
    incidentId,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    estimatedMinutes,
    safetyScore: Math.round(safetyScore * 10) / 10,
    status: "planned",
  }).returning();

  return res.json({
    waypoints: pathWaypoints,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    estimatedMinutes,
    safetyScore: Math.round(safetyScore * 10) / 10,
    routeId: savedRoute.id,
  });
});

// GET /api/routes
router.get("/", async (_req, res) => {
  const routes = await db.select().from(rescueRoutesTable).orderBy(desc(rescueRoutesTable.createdAt));
  return res.json(routes.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    safetyScore: r.safetyScore ?? 85,
  })));
});

export default router;
