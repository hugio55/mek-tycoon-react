# Discord Integration - Gold Tier Nicknames

## Overview

Mek Tycoon now has Discord integration that automatically adds emoji suffixes to Discord nicknames based on users' accumulated gold amounts. When users link their Cardano wallets to Discord, the bot updates their nicknames every hour with the appropriate tier emoji.

## What Was Built

### 1. Database Schema (convex/schema.ts)

**Users Table Extensions:**
- `discordUserId` - Discord snowflake ID
- `discordUsername` - Discord username for reference
- `discordLinkedAt` - Timestamp when linked

**New Tables:**
- `discordConnections` - Links wallets to Discord accounts per server
- `discordGoldTiers` - Configurable gold tier thresholds and emojis

### 2. Convex Functions

**convex/discordIntegration.ts:**
- `linkDiscordToWallet` - Connect wallet to Discord account
- `unlinkDiscordFromWallet` - Remove connection
- `getDiscordConnectionByWallet` - Query connection by wallet
- `getDiscordConnectionByDiscordUser` - Query connection by Discord ID
- `getAllActiveDiscordConnections` - Get all linked users in a server
- `getGoldTiers` - Get active gold tier configuration
- `createGoldTier` / `updateGoldTier` - Manage gold tiers
- `initializeDefaultGoldTiers` - Create default 7-tier system
- `getEmojiForGoldAmount` - Calculate emoji for gold amount
- `getUserGoldAndEmoji` - Get user's gold and tier info
- `updateNicknameTimestamp` - Track last nickname update

**convex/discordSync.ts:**
- `getAllUsersWithDiscordEmojis` - Get all users who need nickname updates
- `syncDiscordNicknames` - Action to sync all nicknames via Discord API

### 3. Discord Bot (discord-bot/)

**bot.js** - Main Discord bot with:
- Automatic hourly nickname sync
- Slash commands: `/linkwallet`, `/unlinkwallet`, `/mygold`, `/syncnicknames`
- Real-time sync after wallet linking
- Full Discord API integration

**Supporting Files:**
- `package.json` - Dependencies (discord.js, convex)
- `.env.example` - Configuration template
- `README.md` - Complete setup instructions

## Default Gold Tiers

| Tier | Min Gold | Max Gold | Emoji |
|------|----------|----------|-------|
| Bronze | 0 | 10,000 | 🥉 |
| Silver | 10,000 | 50,000 | 🥈 |
| Gold | 50,000 | 100,000 | 🥇 |
| Platinum | 100,000 | 250,000 | 💎 |
| Diamond | 250,000 | 500,000 | 💠 |
| Master | 500,000 | 1,000,000 | 👑 |
| Grandmaster | 1,000,000+ | - | ⚡ |

## Setup Process

### 1. Initialize Gold Tiers

Run once in Convex dashboard or via app:
```
discordIntegration:initializeDefaultGoldTiers
```

### 2. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Add bot with these intents:
   - Server Members Intent
   - Message Content Intent (optional)
4. Get Bot Token, Client ID, and Server ID
5. Invite bot with Manage Nicknames permission

### 3. Configure Bot

Copy `.env.example` to `.env` in `discord-bot/` folder:
```
DISCORD_BOT_TOKEN=your_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_server_id
NEXT_PUBLIC_CONVEX_URL=https://rare-dinosaur-331.convex.cloud
```

### 4. Install and Run Bot

```bash
cd discord-bot
npm install
npm start
```

## User Flow

1. User connects Cardano wallet in app
2. User types `/linkwallet [wallet_address]` in Discord
3. Bot stores connection in Convex
4. Bot immediately syncs nickname (adds emoji)
5. Every hour, bot checks all linked users and updates nicknames
6. Users can check status with `/mygold`

## Technical Details

**Nickname Format:**
```
Original Name 🥇
John Smith 💎
MekMaster ⚡
```

**Emoji Removal on Unlink:**
Bot automatically strips tier emojis when user unlinks wallet.

**Rate Limiting:**
- Hourly sync to avoid Discord API limits
- Manual sync available for admins via `/syncnicknames`

**Permissions Required:**
- Bot needs "Manage Nicknames" permission
- Bot's role must be higher than users it modifies
- Cannot modify server owner

## Customization

### Modify Gold Tiers

Use Convex mutations:
```typescript
// Create new tier
discordIntegration:createGoldTier({
  tierName: "Legendary",
  minGold: 5000000,
  maxGold: undefined,
  emoji: "🔥",
  order: 8
})

// Update existing tier
discordIntegration:updateGoldTier({
  tierId: "...",
  emoji: "🌟",
  minGold: 2000000
})
```

### Change Sync Frequency

Edit `bot.js` line with `setInterval`:
```javascript
// Every 30 minutes instead of 60
setInterval(async () => {
  await syncAllNicknames();
}, 1000 * 60 * 30);
```

## Architecture Flow

```
User's Wallet (Cardano)
        ↓
   Convex goldMining table
        ↓
   discordConnections table
        ↓
   Discord Bot (Node.js)
        ↓
   Discord API (Nickname Update)
```

## Security Considerations

- Bot token is sensitive - never commit
- Only user can link/unlink their own wallet
- Admin-only manual sync command
- Ephemeral command responses (private)
- Wallet addresses stored securely in Convex

## Troubleshooting

**Bot offline:** Check console for errors, verify token

**Commands not appearing:** Wait a few minutes, try leaving/rejoining server

**Nickname not updating:** Check bot permissions and role hierarchy

**Wrong gold amount:** Verify wallet is correctly linked, check gold calculation

## Future Enhancements

- Multi-server support (different tiers per server)
- Custom emojis per server
- Leaderboard command showing top gold holders
- Notification when user reaches new tier
- Admin panel to manage tiers in web app