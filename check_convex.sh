#!/bin/bash

echo "=== PHASE 3: DEAD CONVEX FUNCTIONS ==="
echo ""

# Get all convex files (excluding _generated)
for file in $(find convex -name "*.ts" -type f | grep -v "_generated"); do
  filename=$(basename "$file" .ts)
  
  # Skip certain utility/config files that don't export callable functions
  if [[ "$filename" =~ ^(schema|_|types|constants|lib) ]]; then
    continue
  fi
  
  # Check if this file is called via api.<filename>
  call_count=$(grep -r "api\.$filename\." src --include="*.tsx" --include="*.ts" | wc -l)
  
  if [ "$call_count" -eq 0 ]; then
    lines=$(wc -l < "$file")
    last_edit=$(git log -1 --format="%ai" -- "$file" 2>/dev/null | cut -d' ' -f1)
    if [ -z "$last_edit" ]; then
      last_edit="UNTRACKED"
    fi
    echo "DEAD: $filename ($file, $lines lines, last: $last_edit)"
  fi
done
