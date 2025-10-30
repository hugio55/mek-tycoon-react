#!/bin/bash

echo "=== FINAL DEAD CODE ANALYSIS REPORT ==="
echo "Date: 2025-10-29"
echo ""
echo "## 🔴 DEFINITELY DEAD - Orphaned Components (Zero Imports)"
echo ""
echo "### Old Components (6+ months):"
echo "These files are orphaned AND haven't been edited since before April 2025:"
echo ""

# Check age and categorize
for file in $(bash analyze_orphans.sh | grep "ORPHANED:" | awk '{print $2}'); do
  lines=$(wc -l < "$file")
  last_edit=$(git log -1 --format="%ai" -- "$file" 2>/dev/null | cut -d' ' -f1)
  
  if [[ "$last_edit" < "2025-04-29" ]]; then
    echo "- $file ($lines lines, last: $last_edit)"
  fi
done

echo ""
echo "### Recent Components (Orphaned but edited recently):"
echo "These have zero imports but were edited in last 6 months - may be work-in-progress:"
echo ""

for file in $(bash analyze_orphans.sh | grep "ORPHANED:" | awk '{print $2}' | head -20); do
  lines=$(wc -l < "$file")
  last_edit=$(git log -1 --format="%ai" -- "$file" 2>/dev/null | cut -d' ' -f1)
  
  if [[ "$last_edit" >= "2025-04-29" ]]; then
    echo "- $file ($lines lines, last: $last_edit)"
  fi
done

echo ""
echo "## 🟢 UNREACHABLE PAGES"
echo "Pages that exist but have no navigation links:"
echo ""
bash check_pages.sh | head -15

echo ""
echo "## 🟡 DEAD CONVEX FUNCTIONS"  
echo "Backend functions never called from frontend:"
echo ""
bash check_convex.sh | grep "DEAD:" | head -30

echo ""
echo "## 📊 STATISTICS"
orphan_count=$(bash analyze_orphans.sh | grep "ORPHANED:" | wc -l)
unreachable_count=$(bash check_pages.sh | grep "UNREACHABLE:" | wc -l)
dead_convex_count=$(bash check_convex.sh | grep "DEAD:" | wc -l)

echo "- Total orphaned components: $orphan_count"
echo "- Total unreachable pages: $unreachable_count"
echo "- Total dead Convex functions: $dead_convex_count"
echo "- Grand total: $((orphan_count + unreachable_count + dead_convex_count))"
