require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { ConvexHttpClient } = require('convex/browser');

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://rare-dinosaur-331.convex.cloud';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const convex = new ConvexHttpClient(CONVEX_URL);

const commands = [
  new SlashCommandBuilder()
    .setName('linkwallet')
    .setDescription('Link your Cardano wallet to your Discord account')
    .addStringOption(option =>
      option
        .setName('wallet')
        .setDescription('Your Cardano wallet address (stake or payment)')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('unlinkwallet')
    .setDescription('Unlink your Cardano wallet from your Discord account'),
  new SlashCommandBuilder()
    .setName('mygold')
    .setDescription('Check your current gold amount and tier'),
  new SlashCommandBuilder()
    .setName('syncnicknames')
    .setDescription('Manually sync all Discord nicknames (Admin only)'),
].map(command => command.toJSON());

async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Connected to guild: ${GUILD_ID}`);

  await registerCommands();

  setInterval(async () => {
    console.log('Running automatic nickname sync...');
    await syncAllNicknames();
  }, 1000 * 60 * 60);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'linkwallet') {
      let walletAddress = interaction.options.getString('wallet');
      const discordUserId = interaction.user.id;
      const discordUsername = interaction.user.username;

      const conversion = await convex.action('discordIntegration:convertPaymentToStakeAddress', {
        address: walletAddress,
      });

      if (conversion.isPaymentAddress && conversion.stakeAddress) {
        walletAddress = conversion.stakeAddress;
        await interaction.reply({
          content: `🔄 Converted payment address to stake address: \`${walletAddress.substring(0, 20)}...\`\nLinking to your Discord account...`,
          ephemeral: true,
        });
      } else if (conversion.isPaymentAddress && !conversion.stakeAddress) {
        await interaction.reply({
          content: `❌ Could not convert payment address to stake address. Please use your stake address instead.\n\nYou can find your stake address in your wallet settings.`,
          ephemeral: true,
        });
        return;
      }

      await convex.mutation('discordIntegration:linkDiscordToWallet', {
        walletAddress,
        discordUserId,
        discordUsername,
        guildId: GUILD_ID,
      });

      await interaction.editReply({
        content: `✅ Successfully linked wallet \`${walletAddress.substring(0, 20)}...\` to your Discord account!`,
      });

      setTimeout(async () => {
        await syncAllNicknames();
      }, 2000);
    }

    if (commandName === 'unlinkwallet') {
      const connection = await convex.query('discordIntegration:getDiscordConnectionByDiscordUser', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (!connection) {
        await interaction.reply({
          content: '❌ No wallet linked to your Discord account.',
          ephemeral: true,
        });
        return;
      }

      await convex.mutation('discordIntegration:unlinkDiscordFromWallet', {
        walletAddress: connection.walletAddress,
        guildId: GUILD_ID,
      });

      await interaction.reply({
        content: '✅ Successfully unlinked your wallet from Discord.',
        ephemeral: true,
      });

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const currentNickname = member.nickname || member.user.username;
      const cleanNickname = currentNickname.replace(/[🥉🥈🥇💎💠👑⚡]/g, '').trim();

      if (cleanNickname !== currentNickname) {
        await member.setNickname(cleanNickname);
      }
    }

    if (commandName === 'mygold') {
      const connection = await convex.query('discordIntegration:getDiscordConnectionByDiscordUser', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (!connection) {
        await interaction.reply({
          content: '❌ No wallet linked. Use `/linkwallet` to link your Cardano wallet.',
          ephemeral: true,
        });
        return;
      }

      const goldData = await convex.query('discordIntegration:getUserGoldAndEmoji', {
        walletAddress: connection.walletAddress,
      });

      let highestEarnerText = 'None';
      if (goldData.highestEarner) {
        highestEarnerText = `**${goldData.highestEarner.assetName}** - ${goldData.highestEarner.goldPerHour.toFixed(2)} gold/hr` +
          (goldData.highestEarner.rarityRank ? ` (Rank #${goldData.highestEarner.rarityRank})` : '');
      }

      await interaction.reply({
        content: `💰 **Your Gold Stats**\n\n` +
          `**Total Gold:** ${goldData.gold.toLocaleString()}\n` +
          `**Gold per Hour:** ${goldData.goldPerHour.toFixed(2)}\n` +
          `**Tier:** ${goldData.tierName} ${goldData.emoji}\n` +
          `**Highest Earner:** ${highestEarnerText}\n\n` +
          `Wallet: \`${connection.walletAddress.substring(0, 20)}...\``,
        ephemeral: true,
      });
    }

    if (commandName === 'syncnicknames') {
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ You need Administrator permissions to use this command.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const result = await syncAllNicknames();

      await interaction.editReply({
        content: `✅ **Nickname Sync Complete**\n` +
          `Total Users: ${result.totalUsers}\n` +
          `Successful Updates: ${result.successfulUpdates}\n` +
          `Failed Updates: ${result.failedUpdates}`,
      });
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your command.',
      ephemeral: true,
    });
  }
});

async function syncAllNicknames() {
  try {
    const result = await convex.action('discordSync:syncDiscordNicknames', {
      guildId: GUILD_ID,
      botToken: DISCORD_TOKEN,
    });

    console.log('Nickname sync result:', {
      totalUsers: result.totalUsers,
      successfulUpdates: result.successfulUpdates,
      failedUpdates: result.failedUpdates,
    });

    return result;
  } catch (error) {
    console.error('Error syncing nicknames:', error);
    return {
      success: false,
      totalUsers: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
    };
  }
}

if (!DISCORD_TOKEN) {
  console.error('Error: DISCORD_BOT_TOKEN environment variable is not set');
  process.exit(1);
}

if (!DISCORD_CLIENT_ID) {
  console.error('Error: DISCORD_CLIENT_ID environment variable is not set');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('Error: DISCORD_GUILD_ID environment variable is not set');
  process.exit(1);
}

client.login(DISCORD_TOKEN);