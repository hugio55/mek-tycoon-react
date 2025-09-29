# Custom Discord Emojis Guide

## Step-by-Step: Add Your Own Gold Tier Badges

### 1. Create Your Badge Images

**Specs:**
- **Size**: 128x128px (recommended) or 512x512px (max)
- **Format**: PNG, GIF, or WEBP
- **File Size**: Max 256KB per emoji
- **Transparent background**: Works best for badges

**Design Tips:**
- Keep it simple and recognizable at small sizes
- Use distinct colors for each tier
- Match your game's art style

### 2. Upload Emojis to Your Discord Server

1. Open Discord → Your server
2. Server Settings (gear icon)
3. Click **"Emoji"** in sidebar
4. Click **"Upload Emoji"** button
5. Select your badge image
6. Name it clearly (e.g., `gold_tier_1`, `gold_tier_2`, etc.)
7. Click **"Upload"**
8. Repeat for all 10 tiers

**Server Limits:**
- Free servers: 50 emojis
- Boosted servers: Up to 250 emojis (depends on boost level)

### 3. Get Emoji IDs

In any Discord channel, type:
```
\:gold_tier_1:
```

Discord will show:
```
<:gold_tier_1:1234567890123456789>
```

**Copy the entire thing** including `< >` symbols.

### 4. Update Your Bot Configuration

Open `discord-bot/setup-custom-emoji-tiers.js`

Find this section:
```javascript
{
  tierName: "Beginner",
  minGold: 0,
  maxGold: 5000,
  emoji: "🪙", // ← Replace this
  order: 1
},
```

Replace with your custom emoji:
```javascript
{
  tierName: "Beginner",
  minGold: 0,
  maxGold: 5000,
  emoji: "<:gold_tier_1:1234567890123456789>", // ← Your custom emoji
  order: 1
},
```

**Do this for all 10 tiers.**

### 5. Apply Changes

Run:
```bash
cd discord-bot
node setup-custom-emoji-tiers.js
```

Changes take effect immediately - no bot restart needed!

## Example Setup

```javascript
const customTiers = [
  {
    tierName: "Bronze",
    minGold: 0,
    maxGold: 10000,
    emoji: "<:bronze_badge:1421234567890123456>",
    order: 1
  },
  {
    tierName: "Silver",
    minGold: 10000,
    maxGold: 50000,
    emoji: "<:silver_badge:1421234567890123457>",
    order: 2
  },
  // ... and so on
];
```

## Testing Your Custom Emojis

1. Run the setup script
2. In Discord: `/mygold`
3. Your custom emoji should appear next to your tier
4. Check your Discord nickname - custom emoji should be there too

## Troubleshooting

**Emoji not showing?**
- Make sure you copied the FULL emoji code including `< >`
- Check that the emoji exists in your server
- Verify bot has permission to use server emojis

**"Invalid Emoji" error?**
- Emoji ID might be wrong - re-check with `\:emoji_name:`
- Make sure emoji wasn't deleted from server
- Ensure no typos in the emoji name

**Bot can't update nicknames with custom emoji?**
- Bot needs "Use External Emojis" permission
- Custom emojis MUST be from the same server where bot is running

## Mixing Standard and Custom Emojis

You can mix both:
```javascript
{
  tierName: "Beginner",
  emoji: "🪙", // Standard Unicode emoji
  // ...
},
{
  tierName: "Elite",
  emoji: "<:elite_badge:123456789>", // Custom emoji
  // ...
}
```

## Animated Emojis (Nitro)

If you have Nitro or a boosted server:
```javascript
emoji: "<a:gold_sparkle:123456789>" // Note the 'a:' prefix for animated
```

## Need Help?

- Can't upload emoji? Check server boost level
- Emoji not appearing in nicknames? Check bot permissions
- Bot showing emoji code instead of image? Verify emoji ID is correct