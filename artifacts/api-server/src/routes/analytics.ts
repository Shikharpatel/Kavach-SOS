import { Router } from "express";
import { db } from "@workspace/db";
import { incidentsTable, rescueTeamsTable, rescueRoutesTable } from "@workspace/db";
import { rankRegionsByImpact } from "../algorithms/priority_queue.js";

const router = Router();

// GET /api/analytics/region-impact
router.get("/region-impact", async (_req, res) => {
  const incidents = await db.select().from(incidentsTable);

  // Group by region using hash map — O(N)
  const regionMap = new Map<string, { count: number; population: number; totalSev: number; lat: number; lon: number }>();

  for (const inc of incidents) {
    const region = inc.region ?? "Unknown Region";
    const existing = regionMap.get(region) ?? { count: 0, population: 0, totalSev: 0, lat: inc.latitude, lon: inc.longitude };
    regionMap.set(region, {
      count: existing.count + 1,
      population: existing.population + inc.affectedPopulation,
      totalSev: existing.totalSev + inc.severity,
      lat: existing.lat,
      lon: existing.lon,
    });
  }

  const regions = [...regionMap.entries()].map(([region, data]) => ({
    region,
    incidentCount: data.count,
    totalAffected: data.population,
    avgSeverity: Math.round((data.totalSev / data.count) * 10) / 10,
    latitude: data.lat,
    longitude: data.lon,
  }));

  // Use ranking DSA from priority queue module — O(N log N)
  const ranked = rankRegionsByImpact(regions);
  return res.json(ranked);
});

// GET /api/analytics/rescue-efficiency
router.get("/rescue-efficiency", async (_req, res) => {
  const teams = await db.select().from(rescueTeamsTable);
  const routes = await db.select().from(rescueRoutesTable);
  const incidents = await db.select().from(incidentsTable);

  const teamsDeployed = teams.filter(t => t.status === "deployed").length;
  const incidentsResolved = incidents.filter(i => i.status === "resolved").length;
  const totalIncidents = incidents.length;

  const avgResponseMinutes = routes.length > 0
    ? routes.reduce((sum, r) => sum + r.estimatedMinutes, 0) / routes.length
    : 45;

  const avgCoverageKm = routes.length > 0
    ? routes.reduce((sum, r) => sum + r.totalDistanceKm, 0) / routes.length
    : 12;

  return res.json({
    avgResponseMinutes: Math.round(avgResponseMinutes * 10) / 10,
    teamsDeployed,
    incidentsResolved,
    successRate: totalIncidents > 0 ? Math.round((incidentsResolved / totalIncidents) * 1000) / 10 : 0,
    avgCoverageKm: Math.round(avgCoverageKm * 10) / 10,
  });
});

// GET /api/analytics/live-ticker
router.get("/live-ticker", async (_req, res) => {
  const incidents = await db.select().from(incidentsTable).limit(20);

  const messages = [
    "Emergency response teams deployed to flood zone",
    "Shelter capacity at 78% — overflow protocols activated",
    "Medical supplies en route to earthquake epicenter",
    "Cyclone warning issued for coastal districts",
    "Search and rescue operation ongoing in landslide area",
    "Evacuation order issued for 3 districts",
    "Emergency command center activated",
    "Rescue helicopters dispatched to remote areas",
    "Field hospital established near disaster zone",
    "Communication network restored in affected region",
  ];

  const ticker = incidents.map((inc, i) => ({
    id: inc.id,
    message: `[${inc.category.toUpperCase()}] ${inc.title} — ${inc.status.toUpperCase()} | Severity: ${inc.severity}/10`,
    category: inc.category,
    severity: inc.severity,
    timestamp: inc.createdAt.toISOString(),
    region: inc.region ?? "Unknown",
  }));

  // Pad with simulated events if fewer than 10 incidents
  while (ticker.length < 10) {
    const i = ticker.length;
    ticker.push({
      id: 1000 + i,
      message: messages[i % messages.length],
      category: "flood",
      severity: Math.floor(Math.random() * 5) + 3,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      region: "Central District",
    });
  }

  return res.json(ticker);
});

export default router;
