import numpy as np
import pandas as pd
from algorithms.dijkstra_routing import calculate_safest_route
from algorithms.bfs_shelter import find_nearest_shelter
from algorithms.greedy_allocation import allocate_resources

def main():
    print("="*60)
    print("KAVACH SOS - ALGORITHMS DEMO (NUMPY & PANDAS POWERED)")
    print("="*60 + "\n")

    # ---------------------------------------------------------
    # 1. Dijkstra Demo: Team Routing (Pandas Adjacency Matrix)
    # ---------------------------------------------------------
    print(">>> 1. Executing Dijkstra Routing Algorithm")
    # Using np.inf to represent no direct path
    inf = np.inf
    data = {
        'RescueBase':   [0, 5, 10, inf, inf],
        'ZoneA':        [5, 0, inf, 2, 8],
        'ZoneB':        [10, inf, 0, inf, 3],
        'ZoneC':        [inf, 2, inf, 0, 4],
        'IncidentZone': [inf, 8, 3, 4, 0]
    }
    index = ['RescueBase', 'ZoneA', 'ZoneB', 'ZoneC', 'IncidentZone']
    
    # Create Pandas Adjacency Matrix
    road_matrix = pd.DataFrame(data, index=index, columns=index)
    print("Adjacency Matrix (Pandas DataFrame):")
    print(road_matrix)
    print()
    
    path, cost = calculate_safest_route(road_matrix, 'RescueBase', 'IncidentZone')
    print(f"[RESULT] Optimal Route: {' -> '.join(path)} (Cost: {cost})\n")
    
    # ---------------------------------------------------------
    # 2. BFS Demo: Evacuation Shelter Search (NumPy 2D Array)
    # ---------------------------------------------------------
    print(">>> 2. Executing BFS Shelter Search Algorithm")
    # 0 = Safe Path, 1 = Flooded/Blocked, 2 = Shelter
    city_grid = np.array([
        [0, 0, 1, 0, 2],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 2]
    ])
    print("City Grid (NumPy Array):")
    print(city_grid)
    
    incident_x, incident_y = 2, 0
    nearest_shelter = find_nearest_shelter(city_grid, incident_x, incident_y)
    print(f"\n[RESULT] Nearest Reachable Shelter found at coordinate: {nearest_shelter}\n")
    
    # ---------------------------------------------------------
    # 3. Greedy Allocation Demo: Resource Management (Pandas)
    # ---------------------------------------------------------
    print(">>> 3. Executing Greedy Resource Allocation Algorithm")
    active_incidents = pd.DataFrame({
        'id': ['INC-01', 'INC-02', 'INC-03'],
        'severity': [9, 5, 8],
        'population': [500, 100, 300]
    })
    
    total_medical_kits = 60
    resource_dist_df = allocate_resources(active_incidents, total_medical_kits)
    print(f"[RESULT] Resource Distribution Strategy (Pandas DataFrame):")
    print(resource_dist_df.to_string(index=False))
    print("\n" + "="*60)

if __name__ == "__main__":
    main()
