/**
 * Greedy Algorithm for Resource Allocation
 *
 * Used for: Optimally distributing limited emergency resources
 * across incidents based on severity and population size.
 *
 * Strategy: At each step, greedily allocate the most critically
 * needed resource type first, maximizing impact per unit.
 *
 * Time Complexity: O(R log R) for sorting resources by priority
 * Space Complexity: O(R) for allocation tracking
 *
 * DSA Concepts:
 * - Greedy choice property: locally optimal choices lead to global optimum
 * - Priority-based sorting for resource ordering
 * - Hash map for O(1) resource tracking
 */

export interface ResourceItem {
  id: number;
  name: string;
  category: string;
  availableQuantity: number;
  unit: string;
}

export interface AllocationPlan {
  resourceId: number;
  resourceName: string;
  category: string;
  allocated: number;
  unit: string;
}

export interface GreedyAllocationResult {
  allocations: AllocationPlan[];
  efficiencyScore: number;
  shortages: string[];
  totalAllocated: number;
}

/**
 * Resource demand formula based on disaster type and severity.
 * Returns required quantity per category.
 */
function computeDemand(
  severity: number,
  affectedPopulation: number
): Map<string, number> {
  const demandMap = new Map<string, number>();

  // Base demand scales with population and severity
  const baseFactor = Math.ceil(affectedPopulation / 100);
  const severityMultiplier = severity / 5; // normalize to 0.2–2.0

  demandMap.set("food",         Math.ceil(baseFactor * severityMultiplier * 3));
  demandMap.set("water",        Math.ceil(baseFactor * severityMultiplier * 2));
  demandMap.set("medical",      Math.ceil(baseFactor * severityMultiplier * 1.5));
  demandMap.set("rescue_team",  Math.max(1, Math.ceil(severity / 2)));
  demandMap.set("boat",         severity >= 6 ? Math.ceil(severity / 3) : 0);
  demandMap.set("ambulance",    Math.max(1, Math.ceil(severity / 3)));

  return demandMap;
}

/**
 * Priority weights for greedy ordering (higher = more critical).
 * Medical and rescue teams are highest priority.
 */
const PRIORITY_WEIGHTS: Record<string, number> = {
  medical:      10,
  rescue_team:  9,
  ambulance:    8,
  water:        7,
  food:         6,
  boat:         5,
};

/**
 * Greedy Resource Allocation Algorithm.
 *
 * Iterates over resource categories sorted by priority (greedy choice).
 * For each category, allocates as much as needed from available stock.
 * Tracks shortages when demand exceeds supply.
 *
 * @param resources   - Available resource pool
 * @param severity    - Disaster severity (1-10)
 * @param affectedPop - Affected population count
 */
export function greedyAllocate(
  resources: ResourceItem[],
  severity: number,
  affectedPop: number
): GreedyAllocationResult {
  const demand = computeDemand(severity, affectedPop);
  const shortages: string[] = [];
  const allocations: AllocationPlan[] = [];
  let totalDemand = 0;
  let totalFulfilled = 0;

  // Group resources by category using a hash map — O(R)
  const resourceByCategory = new Map<string, ResourceItem[]>();
  for (const res of resources) {
    if (!resourceByCategory.has(res.category)) {
      resourceByCategory.set(res.category, []);
    }
    resourceByCategory.get(res.category)!.push(res);
  }

  // Sort categories by priority weight — greedy ordering O(C log C)
  const sortedCategories = [...demand.entries()]
    .filter(([, qty]) => qty > 0)
    .sort(([catA], [catB]) => (PRIORITY_WEIGHTS[catB] ?? 0) - (PRIORITY_WEIGHTS[catA] ?? 0));

  // Greedy allocation loop: take from most-priority category first
  for (const [category, requiredQty] of sortedCategories) {
    totalDemand += requiredQty;
    const available = resourceByCategory.get(category) ?? [];

    // Sort by available quantity descending (greedily pick largest stocks first)
    available.sort((a, b) => b.availableQuantity - a.availableQuantity);

    let remaining = requiredQty;
    for (const res of available) {
      if (remaining <= 0) break;
      const toAllocate = Math.min(res.availableQuantity, remaining);
      if (toAllocate > 0) {
        allocations.push({
          resourceId:   res.id,
          resourceName: res.name,
          category,
          allocated:    toAllocate,
          unit:         res.unit,
        });
        remaining -= toAllocate;
        totalFulfilled += toAllocate;
      }
    }

    if (remaining > 0) {
      shortages.push(`${category.replace("_", " ")} (need ${remaining} more ${available[0]?.unit ?? "units"})`);
    }
  }

  const efficiencyScore = totalDemand > 0
    ? Math.round((totalFulfilled / totalDemand) * 100 * 10) / 10
    : 100;

  return {
    allocations,
    efficiencyScore,
    shortages,
    totalAllocated: totalFulfilled,
  };
}
