# Demo Mode for BrowserStack Testing

## 🎭 What is Demo Mode?

Demo mode loads your app with **mock wallet data** so you can test the UI on BrowserStack without needing wallet authentication.

---

## 🚀 How to Use Demo Mode

### 1. Start Your Dev Server + Tunnel
Run your hotkey (`Ctrl + Alt + M`) or manually:
```bash
# Terminal 1
npm run dev:all

# Terminal 2
npm run tunnel
```

### 2. Get Your Tunnel URL
From Terminal 2, copy the URL like:
```
https://recall-sheet-photo-alcohol.trycloudflare.com
```

### 3. Add `?demo=true` to the URL
In BrowserStack, use:
```
https://recall-sheet-photo-alcohol.trycloudflare.com/?demo=true
```

### 4. Test Away! 🎉
The app will now load with:
- ✅ 5 demo Meks with various levels (1-5)
- ✅ Gold balance: 1,250.75
- ✅ Cumulative gold: 8,943.22
- ✅ Gold/hr: 70.56
- ✅ Company name: "Demo Industries"
- ✅ All UI fully functional

---

## 🎨 Visual Indicator

When in demo mode, you'll see a **yellow banner** at the top:
```
🎭 DEMO MODE - Using mock data for UI testing
```

---

## 📊 Mock Data Details

**5 Demo Meks:**
1. **Mekanism179** (Tux + Reels + Cannon)
   - Rarity: #1916
   - Level: 3 (20% boost)
   - Gold/hr: 7.74

2. **Mekanism2922** (Robot + Turret + Broadcast)
   - Rarity: #554 (rare!)
   - Level: 5 (40% boost)
   - Gold/hr: 30.53

3. **Mekanism3972** (Head + Rolleiflex + Mini Me)
   - Rarity: #1215
   - Level: 2 (10% boost)
   - Gold/hr: 13.28

4. **Mekanism795** (Head + Reels)
   - Rarity: #1265
   - Level: 1 (no boost)
   - Gold/hr: 11.55

5. **Mekanism2685** (Robot + Security + Wings)
   - Rarity: #1753
   - Level: 1 (no boost)
   - Gold/hr: 7.46

---

## 🔧 For Developers: Using Demo Mode in Components

If you need to access demo data in your components:

```typescript
import { useWalletData } from '@/hooks/useWalletData';

function MyComponent() {
  const { isDemo, data, meks, isLoading } = useWalletData(walletAddress);

  if (isDemo) {
    console.log('Running in demo mode!');
  }

  // Use data normally - works in both demo and production
  return (
    <div>
      <h1>Gold: {data?.accumulatedGold}</h1>
      <p>Meks: {meks.length}</p>
    </div>
  );
}
```

---

## 🔄 Switching Modes

**To exit demo mode:**
- Remove `?demo=true` from URL
- Or just visit the base URL

**To enter demo mode:**
- Add `?demo=true` to any URL
- Works on all pages: `/hub?demo=true`, `/profile?demo=true`, etc.

---

## 🧪 Testing Checklist

When testing on BrowserStack with demo mode:
- [ ] Hub page loads with gold display
- [ ] Profile page shows 5 demo Meks
- [ ] Mek cards display correctly
- [ ] Level indicators show (levels 1-5)
- [ ] Gold mining animation works
- [ ] Mobile responsive layouts work
- [ ] Touch interactions work on mobile
- [ ] No console errors

---

## ⚠️ Limitations

Demo mode is **UI testing only**:
- ❌ No real blockchain interaction
- ❌ No database mutations (data doesn't save)
- ❌ No wallet connection required
- ❌ No real-time updates from Convex

Perfect for:
- ✅ UI/UX testing
- ✅ Responsive design testing
- ✅ Mobile device testing
- ✅ Layout debugging
- ✅ Animation testing

---

## 📝 Notes

- Demo data is **static** - refreshing won't change it
- The yellow banner ensures you know you're in demo mode
- Demo mode works locally AND through Cloudflare tunnel
- All components should work normally with mock data
