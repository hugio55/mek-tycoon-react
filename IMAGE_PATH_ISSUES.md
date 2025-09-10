# Image Path Issues - Root Causes and Solutions

## Common Causes of Broken Images

### 1. **Incorrect Path Structure**
**Problem**: Hardcoded paths that don't match actual file structure
- Example: `/chip-images/mek-chips/heads/acid chip.webp` when files are actually in `/chip-images/mek-chips/Acid A.webp`
- **Solution**: Always verify actual file paths before hardcoding

### 2. **Case Sensitivity Issues**
**Problem**: Mismatched case in file names
- Example: Looking for `acid chip.webp` when file is `Acid A.webp`
- **Solution**: Use exact case matching for file names

### 3. **Missing Dynamic Path Construction**
**Problem**: Using static paths instead of dynamic ones based on data
- Example: All chips showing same image regardless of variation
- **Solution**: Use template literals with data values: `${listing.itemVariation}.webp`

### 4. **No Fallback Images**
**Problem**: No error handling when images fail to load
- **Solution**: Always add `onError` handlers with fallback images

## Prevention Strategies

### 1. **Use Dynamic Paths**
```jsx
// Good - Dynamic based on data
src={`/chip-images/mek-chips/${listing.itemVariation || 'Acid A'}.webp`}

// Bad - Hardcoded
src="/chip-images/mek-chips/heads/acid chip.webp"
```

### 2. **Add Error Handlers**
```jsx
onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.src = '/path/to/fallback-image.webp';
}}
```

### 3. **Verify File Structure**
Before implementing image paths:
1. Check actual directory structure: `ls public/chip-images/`
2. Verify file naming convention
3. Test with actual file names

### 4. **Create Image Maps**
For complex image systems, create mapping objects:
```javascript
const imageMap = {
  'head': {
    'Acid': '/chip-images/mek-chips/Acid A.webp',
    'Chrome': '/chip-images/mek-chips/Chrome S.webp',
    // etc...
  }
}
```

### 5. **Use Image Components**
Create reusable image components that handle errors and fallbacks:
```jsx
const ChipImage = ({ variation, type, fallback }) => {
  return (
    <img 
      src={`/chip-images/mek-chips/${variation}.webp`}
      onError={(e) => e.target.src = fallback}
      alt={variation}
    />
  );
};
```

## Current Fixes Applied

1. **Marketplace Chip Images**: Fixed path from `/heads/acid chip.webp` to dynamic `/${variation}.webp`
2. **Added Error Handlers**: All chip images now fallback to `Acid A.webp` on error
3. **Frame Images**: Using correct SVG paths with dynamic variation names
4. **OEM Images**: Using correct PNG path for Kodak canister
5. **Essence Display**: Created CSS-based bottle visualization instead of relying on missing images

## Testing Checklist

- [ ] Verify all image paths match actual file locations
- [ ] Test with different variations to ensure dynamic paths work
- [ ] Check browser console for 404 errors
- [ ] Verify fallback images load on error
- [ ] Test with missing/renamed files to ensure graceful degradation