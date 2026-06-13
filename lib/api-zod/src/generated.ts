import { z } from "zod";

export const AnalyzeDisasterImageBody = z.any();
export const GetAiActionPlanBody = z.any();
export const HealthCheckResponse = z.any();
export const ListIncidentsQueryParams = z.any();

export const CreateIncidentBody = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["active", "resolved", "monitoring", "critical"]).optional(),
  category: z.enum(["flood", "earthquake", "cyclone", "fire", "landslide", "unknown"]),
  severity: z.number().int().min(1).max(10),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  affectedPopulation: z.number().int().min(0, "Population cannot be negative").optional(),
});

export const UpdateIncidentBody = CreateIncidentBody.partial();
export const UpdateIncidentParams = z.object({ id: z.coerce.number() });
export const DeleteIncidentParams = z.object({ id: z.coerce.number() });
export const GetIncidentParams = z.object({ id: z.coerce.number() });

export const CreateRescueTeamBody = z.object({
  name: z.string().min(1),
  type: z.enum(["medical", "firefighting", "flood_rescue", "search_rescue", "logistics"]),
  size: z.number().int().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(["available", "deployed", "resting", "standby"]).optional()
});

export const UpdateRescueTeamParams = z.object({ id: z.coerce.number() });
export const UpdateRescueTeamBody = CreateRescueTeamBody.partial();

export const CreateResourceBody = z.object({
  name: z.string().min(1),
  category: z.enum(["medical", "food", "water", "equipment", "fuel"]),
  quantity: z.number().int().min(0),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional()
});

export const UpdateResourceParams = z.object({ id: z.coerce.number() });
export const UpdateResourceBody = CreateResourceBody.partial();
export const AllocateResourcesBody = z.object({ incidentId: z.number().int() });
export const PlanRescueRouteBody = z.object({ teamId: z.number().int(), incidentId: z.number().int() });

export const CreateShelterBody = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().int().min(0, "Capacity cannot be negative"),
  status: z.enum(["available", "full", "closed"]).optional()
});

export const UpdateShelterParams = z.object({ id: z.coerce.number() });
export const UpdateShelterBody = CreateShelterBody.partial();
export const DeleteShelterParams = z.object({ id: z.coerce.number() });

export const RecommendSheltersBody = z.object({
  incidentId: z.number().int().optional(),
  latitude: z.number().min(-90, "Latitude must be >= -90").max(90, "Latitude must be <= 90"),
  longitude: z.number().min(-180, "Longitude must be >= -180").max(180, "Longitude must be <= 180"),
  requiredCapacity: z.number().int().min(0, "Capacity cannot be negative"),
});
