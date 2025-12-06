# Mek Tycoon Discord Bot

Discord bot that adds gold tier emojis to user nicknames based on their accumulated gold in Mek Tycoon.

## Features

- **Automatic Nickname Sync**: Updates Discord nicknames every hour with the appropriate gold tier emoji
- **Wallet Linking**: Users can link their Cardano wallets to their Discord accounts
- **Gold Tier Display**: Shows emoji badges based on gold amount (🥉 Bronze, 🥈 Silver, 🥇 Gold, 💎 Platinum, etc.)
- **Slash Commands**: Easy-to-use commands for wallet management

## Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Mek Tycoon Bot"
4. Go to "Bot" section
5. Click "Add Bot"
6. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent (optional)
7. Copy your Bot Token

### 2. Get Application IDs

- **Client ID**: Found in "General Information" tab
- **Guild ID (Server ID)**: Right-click your Discord server → "Copy Server ID" (requires Developer Mode enabled in Discord settings)

### 3. Invite Bot to Server

Use this URL (replace CLIENT_ID with your actual client ID):
```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=268435456&scope=bot%20applications.commands
```

Permissions needed:
- Manage Nicknames (268435456)
- Use Slash Commands

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env` in the `discord-bot` folder
2. Fill in your values:
   ```
   DISCORD_BOT_TOKEN=your_actual_bot_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_GUILD_ID=your_server_id
   NEXT_PUBLIC_CONVEX_URL=https://fabulous-sturgeon-691.convex.cloud
   ```

### 5. Install Dependencies

```bash
cd discord-bot
npm install
```

### 6. Initialize Gold Tiers (One Time)

Run this mutation in your Convex dashboard to create default gold tiers:
```
discordIntegration:initializeDefaultGoldTiers
```

Or call it from your app once.

### 7. Start the Bot

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Commands

Users can use these slash commands in Discord:

- `/linkwallet [wallet]` - Link your Cardano wallet address (stake or payment)
- `/unlinkwallet` - Unlink your wallet from Discord
- `/mygold` - Check your current gold amount and tier
- `/syncnicknames` - Manually trigger nickname sync (Admin only)

## Gold Tiers (Default)

| Tier | Min Gold | Max Gold | Emoji |
|------|----------|----------|-------|
| Bronze | 0 | 10,000 | 🥉 |
| Silver | 10,000 | 50,000 | 🥈 |
| Gold | 50,000 | 100,000 | 🥇 |
| Platinum | 100,000 | 250,000 | 💎 |
| Diamond | 250,000 | 500,000 | 💠 |
| Master | 500,000 | 1,000,000 | 👑 |
| Grandmaster | 1,000,000+ | - | ⚡ |

You can customize tiers in Convex using the `discordIntegration` mutations.

## How It Works

1. Users link their Cardano wallet using `/linkwallet`
2. Bot stores the connection in Convex `discordConnections` table
3. Every hour, bot queries all linked users and their current gold amounts
4. Bot updates Discord nicknames with appropriate emoji suffix
5. Users can check their gold with `/mygold` anytime

## Troubleshooting

**Bot not responding to commands:**
- Check bot has "Use Slash Commands" permission
- Make sure bot is online (check console for "Logged in as...")
- Verify Guild ID is correct

**Nicknames not updating:**
- Bot needs "Manage Nicknames" permission
- Bot's role must be higher than the user's highest role
- Server owner nicknames cannot be changed by bots

**Wallet not linking:**
- Check Convex deployment is running
- Verify CONVEX_URL matches your deployment
- Check wallet address format (should be stake or payment address)

## Architecture

- **Discord.js**: Handles Discord API interactions
- **Convex**: Stores wallet-Discord connections and gold data
- **Automatic Sync**: Runs every hour via setInterval
- **Real-time Updates**: Triggers sync after wallet linking

## Security Notes

- Bot token is sensitive - never commit .env file
- Users can only link/unlink their own wallets
- Nickname sync requires admin permission
- All commands use ephemeral replies (only visible to user)