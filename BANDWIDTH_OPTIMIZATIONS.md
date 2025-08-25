# Bandwidth Optimizations for Mek Tycoon

## Critical Issues Found & Fixed

### 1. **getAllMeks Query** (HIGHEST IMPACT)
- **Problem**: Loading ALL 4000+ Meks with ALL fields on search page
- **Impact**: ~10-20MB per page load
- **Solution**: Created `meksSearch.searchMeks` with:
  - Pagination (default 100-500 items)
  - Field filtering
  - Index-based queries
  - Returns only needed data

### 2. **Marketplace Listings**
- **Problem**: Loading ALL listings without limit
- **Impact**: Growing unbounded as more listings added
- **Solution**: Added pagination to `getActiveListings`:
  - Default limit of 100 items
  - Offset support for pagination
  - Returns total count for UI

### 3. **Stock Companies Query**
- **Problem**: Loading all stock companies repeatedly
- **Impact**: Redundant data fetching
- **Solution**: Consider caching or lazy loading

## Other Optimization Opportunities

### High Impact
1. **Profile Page** - `getMeksByOwner`
   - Currently loads ALL meks for a user
   - Should paginate or limit to visible items

2. **Crafting Recipes**
   - Loads ALL recipes every time
   - Could cache or load on-demand

3. **Buff System**
   - `getAllBuffTypes` loads entire table
   - Consider loading only active buffs

### Medium Impact
1. **Inventory Queries**
   - Could batch queries
   - Add pagination for large inventories

2. **Transaction History**
   - No pagination currently
   - Could grow unbounded

## Implementation Status

✅ **Completed:**
- Created `meksSearch.ts` with optimized search queries
- Updated `marketplace.ts` with pagination
- Modified Shop page to use paginated results
- Modified Admin Shop page to use paginated results
- Updated Search page to use optimized query

⏳ **Pending:**
- Profile page optimization
- Crafting system caching
- Stock data caching
- Transaction history pagination

## Recommended Next Steps

1. **Monitor Usage**: Use Convex dashboard to track which queries use most bandwidth
2. **Add Caching**: Implement client-side caching for rarely-changing data
3. **Lazy Loading**: Load data only when needed (e.g., on scroll)
4. **Field Selection**: Return only necessary fields from queries
5. **Indexes**: Ensure all common query patterns have indexes

## Quick Wins
- Reduce default limits from 100 to 20-50 where appropriate
- Cache static data (buff types, recipes, stock companies)
- Use `take()` instead of `collect()` for limited queries
- Implement infinite scroll instead of pagination where suitable

## Monitoring Queries
Check these queries regularly in Convex dashboard:
- `meks.getAllMeks` (should not be used anymore)
- `marketplace.getActiveListings` (now paginated)
- `stocks.getStockCompanies` (consider caching)
- `crafting.getRecipes` (consider caching)