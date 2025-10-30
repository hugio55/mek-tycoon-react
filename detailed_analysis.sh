#!/bin/bash

echo "=== DETAILED ANALYSIS WITH AGE ==="
echo ""

# Check for files that are both orphaned AND old (6+ months = before 2025-04-29)
OLD_DATE="2025-04-29"

echo "🔴 DEFINITELY DEAD (Orphaned + Old):"
echo ""

# Orphaned components that are old
for file in src/components/CraftingSlots.tsx \
            src/components/CraftingTreeVisual.tsx \
            src/components/MiniSkillTree.tsx \
            src/components/RecipeSelector.tsx \
            src/components/SkillTreeModal.tsx \
            src/components/UserResources.tsx; do
  if [ -f "$file" ]; then
    lines=$(wc -l < "$file")
    last_edit=$(git log -1 --format="%ai" -- "$file" 2>/dev/null | cut -d' ' -f1)
    if [[ "$last_edit" < "$OLD_DATE" ]]; then
      echo "  - $file ($lines lines, last: $last_edit)"
    fi
  fi
done

echo ""
echo "🟡 PROBABLY DEAD (Orphaned but Recent OR Old Convex):"
echo ""

# Count all dead Convex functions
bash check_convex.sh | wc -l

echo ""
echo "📊 CALCULATING TOTALS..."
echo ""

# Count orphaned components
orphan_count=$(bash analyze_orphans.sh | grep "ORPHANED:" | wc -l)
orphan_lines=$(bash analyze_orphans.sh | grep "ORPHANED:" | awk '{print $4}' | tr -d '()' | awk 'BEGIN{sum=0}{sum+=$1}END{print sum}')

# Count unreachable pages
unreachable_count=$(bash check_pages.sh | grep "UNREACHABLE:" | wc -l)

# Count dead convex
dead_convex_count=$(bash check_convex.sh | grep "DEAD:" | wc -l)

echo "Orphaned components: $orphan_count ($orphan_lines lines)"
echo "Unreachable pages: $unreachable_count"
echo "Dead Convex functions: $dead_convex_count"
