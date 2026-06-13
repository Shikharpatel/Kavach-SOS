from typing import List, Dict

def allocate_resources(incidents: List[Dict], available_resources: int) -> Dict[str, int]:
    """
    Greedy algorithm to optimally distribute limited resources (e.g. medical kits) 
    to incidents based on their severity and affected population.
    
    :param incidents: List of incident dictionaries with 'id', 'severity', and 'population'
    :param available_resources: Total units of resources available to dispatch
    :return: Dictionary mapping incident IDs to the number of resources allocated
    """
    # Sort incidents based on a combined priority metric (Severity * Population)
    # Higher priority gets resources first
    sorted_incidents = sorted(
        incidents, 
        key=lambda x: (x['severity'] * x['population']), 
        reverse=True
    )

    allocation = {incident['id']: 0 for incident in incidents}
    remaining_resources = available_resources

    for incident in sorted_incidents:
        if remaining_resources <= 0:
            break
            
        # Assume 1 resource unit covers 10 affected people
        required_resources = (incident['population'] // 10) + 1
        
        allocated = min(required_resources, remaining_resources)
        allocation[incident['id']] = allocated
        remaining_resources -= allocated

    return allocation
