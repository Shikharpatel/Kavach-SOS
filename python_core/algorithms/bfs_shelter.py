import numpy as np
from collections import deque
from typing import Tuple, Optional

def find_nearest_shelter(grid: np.ndarray, start_x: int, start_y: int) -> Optional[Tuple[int, int]]:
    """
    Uses Breadth-First Search (BFS) on a NumPy grid to find the nearest shelter.
    
    :param grid: 2D NumPy array representing map zones (0=safe road, 1=obstacle/flooded, 2=shelter)
    :param start_x: Incident X coordinate
    :param start_y: Incident Y coordinate
    :return: Coordinates of the nearest shelter
    """
    rows, cols = grid.shape
    queue = deque([(start_x, start_y, 0)])
    
    # Track visited cells using a boolean numpy array for memory efficiency
    visited = np.zeros((rows, cols), dtype=bool)
    visited[start_x, start_y] = True
    
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    while queue:
        x, y, distance = queue.popleft()

        # Check if current node is a shelter
        if grid[x, y] == 2:
            return (int(x), int(y))

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            
            # Boundary checks
            if 0 <= nx < rows and 0 <= ny < cols:
                # If not visited and not an obstacle (1)
                if not visited[nx, ny] and grid[nx, ny] != 1:
                    visited[nx, ny] = True
                    queue.append((nx, ny, distance + 1))

    return None
