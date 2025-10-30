#!/bin/bash

# Phase 1: Find orphaned components
echo "=== PHASE 1: ORPHANED COMPONENTS ==="
echo ""

for file in $(find src/components -name "*.tsx" -type f); do
  filename=$(basename "$file" .tsx)
  # Search for imports of this file (excluding the file itself)
  import_count=$(grep -r "from.*['\"].*$filename" src --include="*.tsx" --include="*.ts" | grep -v "^$file:" | wc -l)
  
  if [ "$import_count" -eq 0 ]; then
    # Get file size
    lines=$(wc -l < "$file")
    # Get last modified date from git
    last_edit=$(git log -1 --format="%ai" -- "$file" 2>/dev/null | cut -d' ' -f1)
    if [ -z "$last_edit" ]; then
      last_edit="UNTRACKED"
    fi
    echo "ORPHANED: $file ($lines lines, last: $last_edit)"
  fi
done
