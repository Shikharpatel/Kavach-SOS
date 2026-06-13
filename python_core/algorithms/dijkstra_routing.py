import numpy as np
import pandas as pd
import heapq
from typing import List, Tuple

def calculate_safest_route(adj_matrix: pd.DataFrame, start: str, target: str) -> Tuple[List[str], float]:
    """
    Calculates the safest and shortest route using a Pandas DataFrame adjacency matrix.
    Missing edges are represented as np.inf.
    
    :param adj_matrix: Pandas DataFrame representing the graph weights
    :param start: Starting node (Rescue Team location)
    :param target: Target node (Incident location)
    """
    nodes = adj_matrix.columns.tolist()
    distances = {node: np.inf for node in nodes}
    distances[start] = 0
    priority_queue = [(0, start)]
    previous_nodes = {node: None for node in nodes}

    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)

        if current_node == target:
            break

        if current_distance > distances[current_node]:
            continue

        for neighbor in nodes:
            weight = adj_matrix.at[current_node, neighbor]
            # If an edge exists and is not infinite
            if not np.isinf(weight) and weight > 0:
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
    
    if np.isinf(distances[target]):
        return [], float('inf')
        
    return path, float(distances[target])
