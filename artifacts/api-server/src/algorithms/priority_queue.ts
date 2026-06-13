/**
 * Priority Queue for Emergency Request Handling
 *
 * Used for: Managing incoming emergency requests in order of criticality.
 * Higher severity incidents are processed first regardless of arrival time.
 *
 * DSA Concepts:
 * - Max-heap (binary heap) implementation
 * - Priority Queue abstract data type
 * - O(log N) insert and extract
 * - Used in real-time emergency dispatch systems
 */

export interface EmergencyRequest {
  id: string;
  incidentId: number;
  severity: number;
  timestamp: number;
  category: string;
  description: string;
}

/**
 * Max-Priority Queue backed by a binary heap.
 * Higher severity = higher priority.
 * Tie-breaking by timestamp (earlier = higher priority).
 */
export class EmergencyPriorityQueue {
  private heap: EmergencyRequest[] = [];

  /**
   * Insert a new emergency request — O(log N)
   */
  enqueue(request: EmergencyRequest): void {
    this.heap.push(request);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Extract the highest-priority (most severe) request — O(log N)
   */
  dequeue(): EmergencyRequest | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /**
   * Peek at highest priority without removing — O(1)
   */
  peek(): EmergencyRequest | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  toArray(): EmergencyRequest[] {
    return [...this.heap].sort((a, b) =>
      b.severity !== a.severity ? b.severity - a.severity : a.timestamp - b.timestamp
    );
  }

  private compare(a: EmergencyRequest, b: EmergencyRequest): boolean {
    // Higher severity wins; earlier timestamp wins on tie
    if (a.severity !== b.severity) return a.severity > b.severity;
    return a.timestamp < b.timestamp;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.compare(this.heap[idx], this.heap[parent])) {
        [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
        idx = parent;
      } else break;
    }
  }

  private sinkDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      let largest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < n && this.compare(this.heap[left], this.heap[largest])) largest = left;
      if (right < n && this.compare(this.heap[right], this.heap[largest])) largest = right;
      if (largest !== idx) {
        [this.heap[largest], this.heap[idx]] = [this.heap[idx], this.heap[largest]];
        idx = largest;
      } else break;
    }
  }
}

/**
 * Sorting helper: Rank affected regions by impact score.
 * Uses a composite score: severity * affected_population.
 * O(N log N) quicksort via Array.sort.
 */
export function rankRegionsByImpact<T extends { avgSeverity: number; totalAffected: number }>(
  regions: T[]
): T[] {
  return [...regions].sort((a, b) => {
    const scoreA = a.avgSeverity * a.totalAffected;
    const scoreB = b.avgSeverity * b.totalAffected;
    return scoreB - scoreA; // descending
  });
}
