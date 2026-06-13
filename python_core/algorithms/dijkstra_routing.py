import heapq
from typing import Dict, Tuple, List

def calculate_safest_route(graph: Dict[str, Dict[str, float]], start: str, target: str) -> Tuple[List[str], float]:
    """
    Calculates the safest and shortest route from a rescue team to an incident zone.
    
    :param graph: Adjacency list representing the road network with edge weights
    :param start: Starting node (Rescue Team location)
    :param target: Target node (Incident location)
    :return: Tuple containing the optimal path and the total cost.
    """
    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    priority_queue = [(0, start)]
    previous_nodes = {node: None for node in graph}

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

        if current_node == target:
            break

        if current_distance > distances[current_node]:
            continue

        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous_nodes[neighbor] = current_node
                heapq.heappush(priority_queue, (distance, neighbor))

    # Reconstruct path
    path = []
    current = target
    while current is not None:
        path.append(current)
        current = previous_nodes[current]
    
    path.reverse()
    
    if distances[target] == float('infinity'):
        return [], float('infinity')
        
    return path, distances[target]
