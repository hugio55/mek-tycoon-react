import csv
import json

# Read the CSV file
heads = []
bodies = []
traits = []

with open('../mek_crafting_items_complete.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header
    
    for row in reader:
        if len(row) >= 5:
            # Column 1: Head Variations
            if row[1] and row[1].strip():
                heads.append(row[1].strip())
            
            # Column 3: Body Variations  
            if row[3] and row[3].strip():
                bodies.append(row[3].strip())
                
            # Column 4: Traits
            if row[4] and row[4].strip():
                traits.append(row[4].strip())

# Remove duplicates and sort
heads = sorted(list(set(heads)))
bodies = sorted(list(set(bodies)))
traits = sorted(list(set(traits)))

print(f"Heads: {len(heads)}")
print(f"Bodies: {len(bodies)}")
print(f"Traits: {len(traits)}")
print(f"Total: {len(heads) + len(bodies) + len(traits)}")

# Save to JSON for the image generator
variations = {
    "heads": heads,
    "bodies": bodies,
    "traits": traits
}

with open('mek_variations.json', 'w') as f:
    json.dump(variations, f, indent=2)

print("\nSaved to mek_variations.json")