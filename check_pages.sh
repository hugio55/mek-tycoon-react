#!/bin/bash

echo "=== PHASE 2: UNREACHABLE PAGES ==="
echo ""

# Get all page.tsx files (these are Next.js routes)
for page in $(find src/app -name "page.tsx" -type f); do
  # Extract the route from the file path
  route=$(echo "$page" | sed 's|src/app||' | sed 's|/page.tsx||' | sed 's|^/||')
  if [ -z "$route" ]; then
    route="/"
  else
    route="/$route"
  fi
  
  # Skip admin pages (intentionally not linked)
  if [[ "$route" =~ ^/admin ]]; then
    continue
  fi
  
  # Search for references to this route in the codebase
  # Look for: router.push("/route"), href="/route", pathname="/route", etc.
  search_pattern=$(echo "$route" | sed 's/\[.*\]//')  # Remove dynamic segments for search
  ref_count=$(grep -r "$route" src --include="*.tsx" --include="*.ts" | grep -v "^$page:" | wc -l)
  
  if [ "$ref_count" -eq 0 ]; then
    lines=$(wc -l < "$page")
    last_edit=$(git log -1 --format="%ai" -- "$page" 2>/dev/null | cut -d' ' -f1)
    if [ -z "$last_edit" ]; then
      last_edit="UNTRACKED"
    fi
    echo "UNREACHABLE: $route ($page, $lines lines, last: $last_edit)"
  fi
done
