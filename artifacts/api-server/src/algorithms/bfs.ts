/**
 * Breadth-First Search (BFS) for Shelter Recommendation
 *
 * Used for: Finding the nearest available shelters from an incident location
 * by exploring shelter nodes level by level in a graph.
 *
 * Time Complexity: O(V + E) where V = shelters, E = connections
 * Space Complexity: O(V) for the queue and visited set
 *
 * DSA Concepts:
 * - Queue data structure (FIFO) for BFS traversal
 * - Graph adjacency list for shelter connections
 * - Visited set (hash set) for O(1) cycle detection
 * - Greedy distance scoring for shelter ranking
 */

import { haversineDistance } from "./dijkstra.js";

export interface ShelterNode {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: string;
  address?: string | null;
  facilities?: string[] | null;
}

export interface ShelterRecommendation {
  shelter: ShelterNode;
  distanceKm: number;
  estimatedTravelMinutes: number;
  availableCapacity: number;
  score: number;
}

/**
 * BFS-based shelter recommendation algorithm.
 *
 * Builds a proximity graph where shelters within maxProximityKm of each other
 * are connected. Starting from the incident location, BFS explores the graph
 * to find available shelters ordered by a composite score (distance + capacity).
 *
 * @param incidentLat  - Incident GPS latitude
 * @param incidentLon  - Incident GPS longitude
 * @param shelters     - All available shelter nodes
 * @param requiredCap  - Minimum capacity required
 * @param maxResults   - Maximum shelters to return
 * @param maxProxKm    - Max km distance to connect shelters in graph
 */
export function bfsRecommendShelters(
  incidentLat: number,
  incidentLon: number,
  shelters: ShelterNode[],
  requiredCap: number,
  maxResults: number = 5,
  maxProxKm: number = 200
): ShelterRecommendation[] {
  if (shelters.length === 0) return [];

  // Compute initial distances from incident to each shelter
  const distanceMap = new Map<number, number>();
  for (const shelter of shelters) {
    const dist = haversineDistance(incidentLat, incidentLon, shelter.latitude, shelter.longitude);
    distanceMap.set(shelter.id, dist);
  }

  // Build adjacency graph: connect shelters within maxProxKm of each other
  // This simulates the road network graph for BFS traversal
  const adjacency = new Map<number, number[]>();
  for (const shelter of shelters) adjacency.set(shelter.id, []);
  for (let i = 0; i < shelters.length; i++) {
    for (let j = i + 1; j < shelters.length; j++) {
      const dist = haversineDistance(
        shelters[i].latitude, shelters[i].longitude,
        shelters[j].latitude, shelters[j].longitude
      );
      if (dist <= maxProxKm) {
        adjacency.get(shelters[i].id)!.push(shelters[j].id);
        adjacency.get(shelters[j].id)!.push(shelters[i].id);
      }
    }
  }

  // Sort shelters by distance to create a natural BFS start order
  const startNodes = [...shelters]
    .filter(s => s.status === "available")
    .sort((a, b) => distanceMap.get(a.id)! - distanceMap.get(b.id)!);

  if (startNodes.length === 0) return [];

  // BFS Queue (FIFO) — standard array used as queue with shift()
  const queue: number[] = [startNodes[0].id];
  const visited = new Set<number>();
  const recommendations: ShelterRecommendation[] = [];

  visited.add(startNodes[0].id);

  // BFS traversal
  while (queue.length > 0 && recommendations.length < maxResults) {
    const currentId = queue.shift()!; // dequeue — O(n) but acceptable for small shelter counts

    const shelter = shelters.find(s => s.id === currentId);
    if (!shelter) continue;

    const availableCapacity = shelter.capacity - shelter.currentOccupancy;
    const distanceKm = distanceMap.get(currentId)!;

    // Include shelter if it's available and has enough capacity
    if (shelter.status === "available" && availableCapacity >= requiredCap) {
      // Composite score: lower is better
      // Weight: 60% distance, 40% capacity fill ratio
      const normalizedDist = Math.min(distanceKm / 100, 1);
      const fillRatio = shelter.currentOccupancy / Math.max(shelter.capacity, 1);
      const score = 100 - (normalizedDist * 60 + fillRatio * 40);

      // Average speed 60 km/h for emergency vehicles
      const estimatedTravelMinutes = Math.ceil((distanceKm / 60) * 60);

      recommendations.push({
        shelter,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedTravelMinutes,
        availableCapacity,
        score: Math.max(0, Math.round(score * 10) / 10),
      });
    }

    // Enqueue unvisited neighbors (BFS expansion)
    for (const neighborId of adjacency.get(currentId) ?? []) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }

    // Also enqueue the next closest unvisited shelter (to ensure coverage)
    for (const s of startNodes) {
      if (!visited.has(s.id)) {
        visited.add(s.id);
        queue.push(s.id);
        break;
      }
    }
  }

  // Sort by score descending
  return recommendations.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
