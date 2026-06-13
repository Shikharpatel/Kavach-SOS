from collections import deque
from typing import List, Tuple, Optional

def find_nearest_shelter(grid: List[List[int]], start_x: int, start_y: int) -> Optional[Tuple[int, int]]:
    """
    Uses Breadth-First Search (BFS) to find the nearest available shelter 
    for evacuating affected populations.
    
    :param grid: 2D grid representing map zones (0 = safe road, 1 = obstacle/flooded, 2 = shelter)
    :param start_x: Incident X coordinate
    :param start_y: Incident Y coordinate
    :return: Coordinates of the nearest shelter, or None if unreachable.
    """
    rows, cols = len(grid), len(grid[0])
    queue = deque([(start_x, start_y, 0)])
    visited = set([(start_x, start_y)])
    
    # Directions: Right, Down, Left, Up
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    while queue:
        x, y, distance = queue.popleft()

        # If a shelter is found (value 2)
        if grid[x][y] == 2:
            return (x, y)

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            
            if 0 <= nx < rows and 0 <= ny < cols and (nx, ny) not in visited:
                if grid[nx][ny] != 1:  # 1 represents an obstacle or flooded road
                    visited.add((nx, ny))
                    queue.append((nx, ny, distance + 1))

    return None # No reachable shelter found
