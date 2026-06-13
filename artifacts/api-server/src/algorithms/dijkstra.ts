/**
 * Dijkstra's Shortest Path Algorithm
 *
 * Used for: Computing the shortest/safest rescue route between
 * a rescue team location and a disaster incident location.
 *
 * Time Complexity: O((V + E) log V) with a min-priority-queue
 * Space Complexity: O(V)
 *
 * DSA Concepts:
 * - Priority Queue (min-heap) for selecting the node with lowest tentative distance
 * - Weighted directed graph represented as adjacency list
 * - Relaxation of edges to update shortest distances
 * - Hash Map for O(1) distance lookup
 */

export interface GraphNode {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;   // distance in km
  safetyPenalty: number; // extra cost for unsafe roads (0-1)
}

export interface DijkstraResult {
  path: string[];
  totalDistance: number;
  totalCost: number;
  visited: Set<string>;
}

/**
 * Haversine formula: calculates great-circle distance between two GPS points.
 * Used as edge weights in the road graph.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * MinHeap (Priority Queue) implementation for Dijkstra.
 * Ensures O(log N) insertions and O(log N) extraction of minimum element.
 */
class MinPriorityQueue {
  private heap: Array<{ id: string; dist: number }> = [];

  insert(id: string, dist: number): void {
    this.heap.push({ id, dist });
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin(): { id: string; dist: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].dist > this.heap[idx].dist) {
        [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
        idx = parent;
      } else break;
    }
  }

  private sinkDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && this.heap[left].dist < this.heap[smallest].dist) smallest = left;
      if (right < n && this.heap[right].dist < this.heap[smallest].dist) smallest = right;
      if (smallest !== idx) {
        [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
        idx = smallest;
      } else break;
    }
  }
}

/**
 * Dijkstra's algorithm on a weighted graph.
 *
 * @param nodes - All graph nodes (GPS waypoints)
 * @param edges - Weighted edges between nodes
 * @param startId - Source node ID
 * @param endId - Destination node ID
 * @returns DijkstraResult with shortest path, total distance, and visited set
 */
export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startId: string,
  endId: string
): DijkstraResult {
  // Build adjacency list: O(E)
  const adjacency = new Map<string, Array<{ to: string; cost: number }>>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    const effectiveCost = edge.weight * (1 + edge.safetyPenalty);
    adjacency.get(edge.from)?.push({ to: edge.to, cost: effectiveCost });
    adjacency.get(edge.to)?.push({ to: edge.from, cost: effectiveCost }); // undirected
  }

  // Distance map (hash map for O(1) lookup) initialized to Infinity
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(startId, 0);

  // Min-priority queue (min-heap)
  const pq = new MinPriorityQueue();
  pq.insert(startId, 0);

  while (pq.size > 0) {
    const { id: current } = pq.extractMin()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (current === endId) break;

    for (const { to, cost } of adjacency.get(current) ?? []) {
      const newDist = dist.get(current)! + cost;
      if (newDist < dist.get(to)!) {
        // Edge relaxation
        dist.set(to, newDist);
        prev.set(to, current);
        pq.insert(to, newDist);
      }
    }
  }

  // Reconstruct path by tracing predecessors
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return {
    path: path.length > 1 ? path : [startId, endId],
    totalDistance: dist.get(endId) === Infinity ? 0 : dist.get(endId)!,
    totalCost: dist.get(endId) === Infinity ? 0 : dist.get(endId)!,
    visited,
  };
}

/**
 * Generate intermediate waypoints along a straight-line path.
 * In a real system these would be real road network nodes.
 * Here we interpolate GPS points to simulate road waypoints.
 */
export function generateWaypoints(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
  numWaypoints: number = 4
): Array<{ lat: number; lon: number }> {
  const waypoints: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i <= numWaypoints + 1; i++) {
    const t = i / (numWaypoints + 1);
    // Add small random deviation to simulate road curves
    const jitter = (Math.random() - 0.5) * 0.02;
    waypoints.push({
      lat: fromLat + (toLat - fromLat) * t + jitter,
      lon: fromLon + (toLon - fromLon) * t + jitter,
    });
  }
  waypoints[0] = { lat: fromLat, lon: fromLon };
  waypoints[waypoints.length - 1] = { lat: toLat, lon: toLon };
  return waypoints;
}
