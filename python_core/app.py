import json
from algorithms.dijkstra_routing import calculate_safest_route
from algorithms.bfs_shelter import find_nearest_shelter
from algorithms.greedy_allocation import allocate_resources

def main():
    print("="*50)
    print("KAVACH SOS - DISASTER RESPONSE ALGORITHMS DEMO")
    print("="*50 + "\n")

    # ---------------------------------------------------------
    # 1. Dijkstra Demo: Team Routing
    # ---------------------------------------------------------
    print(">>> 1. Executing Dijkstra Routing Algorithm")
    road_network = {
        'RescueBase': {'ZoneA': 5, 'ZoneB': 10},
        'ZoneA': {'RescueBase': 5, 'IncidentZone': 8, 'ZoneC': 2},
        'ZoneB': {'RescueBase': 10, 'IncidentZone': 3},
        'ZoneC': {'ZoneA': 2, 'IncidentZone': 4},
        'IncidentZone': {'ZoneA': 8, 'ZoneB': 3, 'ZoneC': 4}
    }
    path, cost = calculate_safest_route(road_network, 'RescueBase', 'IncidentZone')
    print(f"[RESULT] Optimal Route: {' -> '.join(path)} (Cost: {cost})\n")
    
    # ---------------------------------------------------------
    # 2. BFS Demo: Evacuation Shelter Search
    # ---------------------------------------------------------
    print(">>> 2. Executing BFS Shelter Search Algorithm")
    # 0 = Safe Path, 1 = Flooded/Blocked, 2 = Shelter
    city_grid = [
        [0, 0, 1, 0, 2],
        [0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 2]
    ]
    incident_x, incident_y = 2, 0
    nearest_shelter = find_nearest_shelter(city_grid, incident_x, incident_y)
    print(f"[RESULT] Nearest Reachable Shelter found at coordinate: {nearest_shelter}\n")
    
    # ---------------------------------------------------------
    # 3. Greedy Allocation Demo: Resource Management
    # ---------------------------------------------------------
    print(">>> 3. Executing Greedy Resource Allocation Algorithm")
    active_incidents = [
        {'id': 'INC-01', 'severity': 9, 'population': 500},
        {'id': 'INC-02', 'severity': 5, 'population': 100},
        {'id': 'INC-03', 'severity': 8, 'population': 300}
    ]
    total_medical_kits = 60
    resource_dist = allocate_resources(active_incidents, total_medical_kits)
    print(f"[RESULT] Resource Distribution Strategy:")
    print(json.dumps(resource_dist, indent=2))
    print("\n" + "="*50)

if __name__ == "__main__":
    main()
