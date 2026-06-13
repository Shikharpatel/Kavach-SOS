import pandas as pd

def allocate_resources(incidents_df: pd.DataFrame, available_resources: int) -> pd.DataFrame:
    """
    Greedy algorithm to optimally distribute limited resources using Pandas.
    
    :param incidents_df: DataFrame containing 'id', 'severity', and 'population'
    :param available_resources: Total units of resources available
    :return: DataFrame with the allocation results
    """
    # Create priority score: severity * population (vectorized operation)
    incidents_df['priority_score'] = incidents_df['severity'] * incidents_df['population']
    
    # Sort by priority using pandas
    sorted_df = incidents_df.sort_values(by='priority_score', ascending=False).copy()
    
    # Calculate required resources (vectorized operation)
    sorted_df['required_resources'] = (sorted_df['population'] // 10) + 1
    
    # Allocate resources greedily
    allocated = []
    remaining = available_resources
    
    for req in sorted_df['required_resources']:
        alloc = min(req, remaining)
        allocated.append(alloc)
        remaining -= alloc
        
    # Append the results to the dataframe
    sorted_df['allocated_resources'] = allocated
    
    return sorted_df[['id', 'severity', 'population', 'required_resources', 'allocated_resources']]
