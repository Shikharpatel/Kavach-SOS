import yaml

def set_constraints(node):
    if isinstance(node, dict):
        # Apply constraints based on property name or type
        for k, v in node.items():
            if k == 'properties' and isinstance(v, dict):
                for prop_name, prop_def in v.items():
                    if not isinstance(prop_def, dict): continue
                    
                    prop_type = prop_def.get('type')
                    if prop_type == 'number' or prop_type == 'integer':
                        if prop_name == 'latitude':
                            prop_def['minimum'] = -90
                            prop_def['maximum'] = 90
                        elif prop_name == 'longitude':
                            prop_def['minimum'] = -180
                            prop_def['maximum'] = 180
                        elif prop_name in ['capacity', 'requiredCapacity', 'availableCapacity', 'affectedPopulation']:
                            prop_def['minimum'] = 0
                        elif prop_name == 'severity':
                            prop_def['minimum'] = 1
                            prop_def['maximum'] = 10
                        elif prop_name == 'size':
                            prop_def['minimum'] = 1

            set_constraints(v)
    elif isinstance(node, list):
        for item in node:
            set_constraints(item)

with open('lib/api-spec/openapi.yaml', 'r') as f:
    spec = yaml.safe_load(f)

set_constraints(spec)

with open('lib/api-spec/openapi.yaml', 'w') as f:
    yaml.dump(spec, f, sort_keys=False)
