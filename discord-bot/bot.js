require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { ConvexHttpClient } = require('convex/browser');
const { createCanvas, loadImage, registerFont } = require('canvas');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
const GIFEncoder = require('gif-encoder-2');
const fs = require('fs');
const path = require('path');

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
    .setDescription('Link a Cardano wallet to your Discord account')
    .addStringOption(option =>
      option
        .setName('wallet')
        .setDescription('Your Cardano wallet address (stake or payment)')
        .setRequired(true)
        .setMinLength(50)
        .setMaxLength(120)
    )
    .addStringOption(option =>
      option
        .setName('nickname')
        .setDescription('Optional nickname for this wallet (e.g., "Main Wallet", "Trading Wallet")')
        .setRequired(false)
        .setMaxLength(50)
    ),
  new SlashCommandBuilder()
    .setName('unlinkwallet')
    .setDescription('Unlink one of your Cardano wallets from your Discord account'),
  new SlashCommandBuilder()
    .setName('wallets')
    .setDescription('View all wallets linked to your Discord account'),
  new SlashCommandBuilder()
    .setName('mygold')
    .setDescription('Check your total gold amount and tier across all linked wallets'),
  new SlashCommandBuilder()
    .setName('corp')
    .setDescription('Display your corporation stats and employees')
    .addBooleanOption(option =>
      option
        .setName('hidden')
        .setDescription('Make the response visible only to you')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('syncnicknames')
    .setDescription('Manually sync all Discord nicknames (Admin only)'),
  new SlashCommandBuilder()
    .setName('todo')
    .setDescription('Open your personal to-do list'),
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

// === TO-DO LIST MANAGEMENT (Convex-backed for persistence) ===
const TASKS_PER_PAGE = 10;

// All todo operations now use Convex database instead of local file storage
async function getTodoData() {
  return await convex.query('discordTodos:getTodoData');
}

async function addTask(taskText) {
  return await convex.mutation('discordTodos:addTask', { text: taskText });
}

async function toggleTask(taskNumber) {
  try {
    return await convex.mutation('discordTodos:toggleTask', { taskNumber });
  } catch (error) {
    console.error('[TODO] Error toggling task:', error);
    return null;
  }
}

async function deleteTask(taskNumber) {
  try {
    return await convex.mutation('discordTodos:deleteTask', { taskNumber });
  } catch (error) {
    console.error('[TODO] Error deleting task:', error);
    return null;
  }
}

async function clearCompleted() {
  return await convex.mutation('discordTodos:clearCompleted');
}

async function setMode(mode) {
  await convex.mutation('discordTodos:setMode', { mode });
}

async function setPage(page) {
  await convex.mutation('discordTodos:setPage', { page });
}

async function setMessageInfo(messageId, channelId) {
  await convex.mutation('discordTodos:setMessageInfo', { messageId, channelId });
}

function buildTodoEmbed(userData) {
  const tasks = userData.tasks;
  const mode = userData.mode || 'view';

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const embed = new EmbedBuilder()
    .setColor(0xFAB617)
    .setTitle('⚙️ MEK GOLD TO DO LIST ⚙️');

  const modeLabels = {
    view: '👁️ VIEW MODE',
    complete: '✅ COMPLETE MODE',
    uncomplete: '↩️ UNCOMPLETE MODE',
    delete: '🗑️ DELETE MODE',
  };

  let description = mode === 'view' ? '\n\n\n\n\n\n' : `**${modeLabels[mode]}**\n\n`;

  if (tasks.length === 0) {
    description += `*No tasks yet. Click "Add Task" to begin.*\n`;
  } else {
    tasks.forEach((task, idx) => {
      const taskNumber = idx + 1;
      const status = task.completed ? '☑' : '☐';
      const strikethrough = task.completed ? '~~' : '';

      description += `${status} **[${taskNumber}]** ${strikethrough}${task.text}${strikethrough}\n`;
    });
  }

  embed.setDescription(description);
  return embed;
}

function buildTodoButtons(userData, isAdmin = false) {
  // Non-admins see no buttons (read-only view)
  if (!isAdmin) {
    return [];
  }

  const tasks = userData.tasks;
  const mode = userData.mode || 'view';
  const rows = [];

  // Add task dropdown if in edit mode and tasks exist
  if (mode !== 'view' && tasks.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('todo_select_task')
      .setPlaceholder('Select a task to ' + (mode === 'complete' ? 'complete' : mode === 'uncomplete' ? 'uncomplete' : 'delete'));

    // Discord dropdowns support max 25 options
    const displayTasks = tasks.slice(0, 25);
    let validOptionsCount = 0;

    displayTasks.forEach((task, idx) => {
      const taskNumber = idx + 1;

      // Clean task text - remove newlines, tabs, and other problematic characters
      const cleanText = task.text
        .replace(/[\n\r\t]/g, ' ')  // Replace newlines/tabs with spaces
        .replace(/\s+/g, ' ')        // Collapse multiple spaces
        .trim();

      // Ensure label is not empty and within Discord's limits (1-100 chars)
      const label = `${taskNumber}. ${cleanText}`.substring(0, 100);

      // Don't add option if label would be too short (just the number)
      if (label.length <= `${taskNumber}. `.length) {
        return; // Skip this task
      }

      const option = new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setValue(taskNumber.toString())
        .setDescription(task.completed ? 'Completed' : 'Incomplete');

      // Only add emoji for completed tasks (checkmark)
      if (task.completed) {
        option.setEmoji('✅');
      }

      selectMenu.addOptions(option);
      validOptionsCount++;
    });

    // Only add the dropdown if we have at least one valid option
    if (validOptionsCount > 0) {
      const selectRow = new ActionRowBuilder().addComponents(selectMenu);
      rows.push(selectRow);
    }
  }

  // Mode buttons row
  const modeRow = new ActionRowBuilder();

  if (mode === 'view') {
    modeRow.addComponents(
      new ButtonBuilder()
        .setCustomId('todo_mode_complete')
        .setLabel('Complete')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('todo_mode_uncomplete')
        .setLabel('Uncomplete')
        .setEmoji('↩️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('todo_mode_delete')
        .setLabel('Delete')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    modeRow.addComponents(
      new ButtonBuilder()
        .setCustomId('todo_mode_view')
        .setLabel('Back to View')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  modeRow.addComponents(
    new ButtonBuilder()
      .setCustomId('todo_add')
      .setLabel('Add Task')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success)
  );

  if (tasks.filter(t => t.completed).length > 0) {
    modeRow.addComponents(
      new ButtonBuilder()
        .setCustomId('todo_clear')
        .setLabel('Clear Done')
        .setEmoji('🧹')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  rows.push(modeRow);

  return rows;
}

// Helper function to download image from URL
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Generate animated GIF badge with pulsing effect
async function generateAnimatedBadge() {
  const size = 100;
  const frames = 10;
  const encoder = new GIFEncoder(size, size);

  encoder.start();
  encoder.setRepeat(0);   // 0 = loop forever
  encoder.setDelay(100);  // 100ms per frame
  encoder.setQuality(10); // Lower = better quality

  const GOLD = '#FAB617';
  const GOLD_DIM = '#D4A017';

  for (let frame = 0; frame < frames; frame++) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, size, size);

    // Calculate pulse effect (0 to 1 and back)
    const pulse = Math.abs(Math.sin((frame / frames) * Math.PI * 2));
    const glowIntensity = 0.3 + (pulse * 0.7);

    // Outer glow effect
    const glowGradient = ctx.createRadialGradient(size/2, size/2, 20, size/2, size/2, 50);
    glowGradient.addColorStop(0, `rgba(250, 182, 23, ${glowIntensity})`);
    glowGradient.addColorStop(1, 'rgba(250, 182, 23, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, size, size);

    // Main badge
    const badgeSize = 70;
    const badgeX = (size - badgeSize) / 2;
    const badgeY = (size - badgeSize) / 2;

    // Badge gradient
    const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeSize);
    badgeGradient.addColorStop(0, GOLD);
    badgeGradient.addColorStop(1, GOLD_DIM);
    ctx.fillStyle = badgeGradient;
    ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);

    // Badge border (thicker during pulse)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 + (pulse * 2);
    ctx.strokeRect(badgeX, badgeY, badgeSize, badgeSize);

    // Badge text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('#1', size / 2, size / 2);

    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

// Generate corporation image with industrial sci-fi aesthetic
// Optimized for Discord embed width (432px display, 800px actual for sharpness)
async function generateCorporationImage(corpData, username) {
  const width = 800;
  const height = 1468; // Reduced by 8px for tighter footer spacing
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Constants
  const GOLD = '#FAB617';
  const GOLD_DIM = '#D4A017';
  const DARK_BG = '#1A1A1A';
  const DARKER_BG = '#0F0F0F';
  const GRAY_TEXT = '#AAAAAA';
  const WHITE = '#FFFFFF';

  // Level colors (matching game levels 1-10)
  const LEVEL_COLORS = [
    '#4ade80', // Level 1 - Green
    '#22c55e', // Level 2 - Darker Green
    '#10b981', // Level 3 - Emerald
    '#14b8a6', // Level 4 - Teal
    '#06b6d4', // Level 5 - Cyan
    '#0ea5e9', // Level 6 - Sky Blue
    '#3b82f6', // Level 7 - Blue
    '#6366f1', // Level 8 - Indigo
    '#8b5cf6', // Level 9 - Violet
    '#a855f7', // Level 10 - Purple
  ];

  // Background - deep black with subtle gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, DARKER_BG);
  bgGradient.addColorStop(0.5, DARK_BG);
  bgGradient.addColorStop(1, DARKER_BG);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Outer gold border with double-line effect
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Diagonal hazard stripes in background (extends down to TOP EMPLOYEES section)
  ctx.save();
  ctx.globalAlpha = 0.08;
  const stripeWidth = 30;
  const stripeEndY = 900; // Extended to cover header, info, stats boxes area
  for (let i = -height; i < width; i += stripeWidth * 2) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(i + width * 0.5, 0);
    ctx.lineTo(i + width * 0.5 + stripeWidth, 0);
    ctx.lineTo(i + stripeWidth, stripeEndY);
    ctx.lineTo(i, stripeEndY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // === HEADER SECTION ===
  let y = 100;

  // Corporation Name - large and prominent (proper case)
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'left';
  const nameText = corpData.companyName; // Keep original capitalization
  ctx.fillText(nameText, 40, y);

  // Add subtle shadow for depth
  ctx.fillStyle = 'rgba(250, 182, 23, 0.3)';
  ctx.fillText(nameText, 42, y + 2);

  // Corporation Rank - top right corner (higher up)
  ctx.fillStyle = GOLD_DIM;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`RANK ${corpData.rank} OF ${corpData.totalCorporations}`, width - 40, 90);
  ctx.textAlign = 'left'; // Reset text alignment

  y += 50;

  // Horizontal divider line
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();

  // Add angled cut on left side of divider
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(40, y - 8);
  ctx.lineTo(60, y - 8);
  ctx.lineTo(50, y + 8);
  ctx.lineTo(40, y + 8);
  ctx.closePath();
  ctx.fill();

  y += 40;

  // === INFO SECTION (4-column single row with equal spacing) ===
  const col1X = 40;
  const col2X = 240;
  const col3X = 440;
  const col4X = 640;
  const labelSize = '18px Arial';
  const valueSize = 'bold 22px Arial';

  // Owner
  ctx.fillStyle = GRAY_TEXT;
  ctx.font = labelSize;
  ctx.fillText('OWNER', col1X, y);
  ctx.fillStyle = WHITE;
  ctx.font = valueSize;
  ctx.fillText(username, col1X, y + 28);

  // Corp Age
  ctx.fillStyle = GRAY_TEXT;
  ctx.font = labelSize;
  ctx.fillText('CORP AGE', col2X, y);
  ctx.fillStyle = WHITE;
  ctx.font = valueSize;
  ctx.fillText(`${corpData.corporationAge} DAYS`, col2X, y + 28);

  // Blockfrost
  ctx.fillStyle = GRAY_TEXT;
  ctx.font = labelSize;
  ctx.fillText('BLOCKFROST', col3X, y);
  ctx.fillStyle = corpData.isBlockchainVerified ? '#00FF00' : '#FF4444';
  ctx.font = valueSize;
  ctx.fillText(corpData.isBlockchainVerified ? '● VERIFIED' : '✗ UNVERIFIED', col3X, y + 28);

  // Status
  ctx.fillStyle = GRAY_TEXT;
  ctx.font = labelSize;
  ctx.fillText('STATUS', col4X, y);
  ctx.fillStyle = '#00FF00';
  ctx.font = valueSize;
  ctx.fillText('● ACTIVE', col4X, y + 28);

  y += 70;

  // === STATS BOXES (full width, stacked vertically for readability) ===
  const boxX = 40;
  const boxWidth = width - 80;
  const boxHeight = 90;
  const boxGap = 20;

  // Helper function to draw industrial stat box
  function drawStatBox(x, y, label, value, unit) {
    // Box background with gradient
    const boxGradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
    boxGradient.addColorStop(0, 'rgba(250, 182, 23, 0.05)');
    boxGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = boxGradient;
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // Gold border with angled corner
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + boxWidth, y);
    ctx.lineTo(x + boxWidth, y + boxHeight);
    ctx.lineTo(x, y + boxHeight);
    ctx.closePath();
    ctx.stroke();

    // Label (more white, less gray)
    ctx.fillStyle = '#CCCCCC';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 24, y + 32);

    // Value (large and prominent)
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(value.toString(), x + 24, y + 72);

    // Unit (less prominent, grayer with more spacing)
    if (unit) {
      ctx.fillStyle = GRAY_TEXT;
      ctx.font = 'bold 32px Arial';
      const valueWidth = ctx.measureText(value.toString()).width;
      ctx.fillText(unit, x + 24 + valueWidth + 20, y + 72); // Added 20px gap
    }
  }

  // Draw three stat boxes
  drawStatBox(boxX, y, 'CUMULATIVE GOLD', corpData.totalCumulativeGold.toLocaleString(), '');
  y += boxHeight + boxGap;

  drawStatBox(boxX, y, 'PRODUCTION RATE', corpData.goldPerHour.toFixed(0), 'g/hr');
  y += boxHeight + boxGap;

  drawStatBox(boxX, y, 'WORKFORCE', corpData.mekCount, 'Meks');
  y += boxHeight + boxGap + 20;

  // === TOP EMPLOYEES SECTION ===
  // Section header - simple, clean design without stripes
  const headerY = y;
  const headerHeight = 60;

  // Solid dark background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(40, headerY, width - 80, headerHeight);

  // Gold border on top and bottom
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, headerY);
  ctx.lineTo(width - 40, headerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, headerY + headerHeight);
  ctx.lineTo(width - 40, headerY + headerHeight);
  ctx.stroke();

  // Header text
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('TOP EMPLOYEES', 50, headerY + 42);

  y += headerHeight + 30;

  // === MEK EMPLOYEE CARDS ===
  const topThree = corpData.meks.slice(0, 3);
  const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3100';

  const mekCardWidth = width - 80;
  const mekCardHeight = 210;
  const mekImageSize = 170;
  const mekCardGap = 20;

  for (let i = 0; i < Math.min(3, topThree.length); i++) {
    const mek = topThree[i];
    const cardX = 40;
    const cardY = y;

    // Card background - more interesting with diagonal pattern overlay
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + mekCardWidth, cardY + mekCardHeight);
    cardGradient.addColorStop(0, 'rgba(26, 26, 26, 0.95)');
    cardGradient.addColorStop(0.5, 'rgba(15, 15, 15, 0.98)');
    cardGradient.addColorStop(1, 'rgba(10, 10, 10, 1)');
    ctx.fillStyle = cardGradient;
    ctx.fillRect(cardX, cardY, mekCardWidth, mekCardHeight);

    // Add diagonal stripe pattern for visual interest
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let stripe = 0; stripe < mekCardWidth; stripe += 15) {
      if (stripe % 30 === 0) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(cardX + stripe, cardY, 8, mekCardHeight);
      }
    }
    ctx.restore();

    // Card border
    ctx.strokeStyle = i === 0 ? GOLD : GOLD_DIM;
    ctx.lineWidth = i === 0 ? 3 : 2;
    ctx.strokeRect(cardX, cardY, mekCardWidth, mekCardHeight);

    // Load and draw Mek image (with equal padding on left, top, bottom)
    const imageX = cardX + 20;
    const imageY = cardY + 20;

    try {
      if (mek.imageUrl) {
        const imageUrl = `${websiteUrl}${mek.imageUrl}`;
        console.log(`[IMAGE GEN] Loading image ${i + 1}: ${imageUrl}`);
        const imageBuffer = await downloadImage(imageUrl);
        const pngBuffer = await sharp(imageBuffer).png().toBuffer();
        const mekImage = await loadImage(pngBuffer);

        // Image background (dark frame)
        ctx.fillStyle = '#000000';
        ctx.fillRect(imageX, imageY, mekImageSize, mekImageSize);

        // Gold border around image
        ctx.strokeStyle = GOLD_DIM;
        ctx.lineWidth = 2;
        ctx.strokeRect(imageX, imageY, mekImageSize, mekImageSize);

        // Draw image
        ctx.drawImage(mekImage, imageX, imageY, mekImageSize, mekImageSize);
        console.log(`[IMAGE GEN] Successfully loaded image ${i + 1}`);
      } else {
        console.log(`[IMAGE GEN] No imageUrl for Mek ${i + 1}`);
        // No image placeholder
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(imageX, imageY, mekImageSize, mekImageSize);
        ctx.strokeStyle = GOLD_DIM;
        ctx.lineWidth = 2;
        ctx.strokeRect(imageX, imageY, mekImageSize, mekImageSize);
        ctx.fillStyle = GRAY_TEXT;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NO IMAGE', imageX + mekImageSize / 2, imageY + mekImageSize / 2);
      }
    } catch (error) {
      console.error(`[IMAGE GEN] Error loading Mek image ${i + 1}:`, error.message);
      // Error placeholder
      ctx.fillStyle = '#220000';
      ctx.fillRect(imageX, imageY, mekImageSize, mekImageSize);
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(imageX, imageY, mekImageSize, mekImageSize);
      ctx.fillStyle = '#FF4444';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('IMAGE', imageX + mekImageSize / 2, imageY + mekImageSize / 2 - 12);
      ctx.fillText('ERROR', imageX + mekImageSize / 2, imageY + mekImageSize / 2 + 12);
    }

    // Mek info (right side of image)
    const infoX = imageX + mekImageSize + 30;
    const infoY = imageY;

    // Mek number (less prominent - grayer)
    ctx.fillStyle = GRAY_TEXT;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`MEK #${mek.mekNumber || '????'}`, infoX, infoY + 32);

    // Rarity rank
    ctx.fillStyle = GRAY_TEXT;
    ctx.font = '18px Arial';
    ctx.fillText('RARITY RANK', infoX, infoY + 66);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 26px Arial';
    ctx.fillText((mek.rarityRank || 0).toLocaleString(), infoX, infoY + 96); // +2px gap

    // Level (with level color)
    ctx.fillStyle = GRAY_TEXT;
    ctx.font = '18px Arial';
    ctx.fillText('LEVEL', infoX, infoY + 128); // +2px gap

    // Get level color (clamp to 1-10 range)
    const levelIndex = Math.min(Math.max(mek.level - 1, 0), 9);
    const levelColor = LEVEL_COLORS[levelIndex];

    ctx.fillStyle = levelColor;
    ctx.font = 'bold 26px Arial';
    ctx.fillText(mek.level.toString(), infoX, infoY + 156); // +2px gap

    // Gold per hour (simple, large number on backplate)
    const cardRightEdge = cardX + mekCardWidth;
    const ghrX = cardRightEdge - 20;
    const ghrY = infoY + 130;

    // GHR value (large, yellow, right-aligned)
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${mek.goldPerHour.toFixed(1)}`, ghrX, ghrY);

    // G/HR label (gray, smaller, right-aligned with spacing)
    ctx.fillStyle = GRAY_TEXT;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('g/hr', ghrX, ghrY + 24);

    y += mekCardHeight + mekCardGap;
  }

  // === FOOTER ===
  y += 10; // Small gap after last employee card

  // Footer divider
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(width - 40, y);
  ctx.stroke();

  y += 30;

  // Footer text
  ctx.fillStyle = GRAY_TEXT;
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  ctx.fillText(`VERIFIED VIA BLOCKFROST • ${dateStr.toUpperCase()} AT ${timeStr.toUpperCase()}`, width / 2, y);

  return canvas.toBuffer('image/png');
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
  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'todo_add_modal') {
      // Check admin permissions
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ Only administrators can modify the todo list.',
          ephemeral: true,
        });
        return;
      }

      try {
        const taskText = interaction.fields.getTextInputValue('task_input');

        await addTask(taskText);

        const userData = await getTodoData();
        const embed = buildTodoEmbed(userData);
        const buttons = buildTodoButtons(userData, true);

        let updateSuccessful = false;

        try {
          if (userData.messageId && userData.channelId) {
            const channel = await client.channels.fetch(userData.channelId);
            const message = await channel.messages.fetch(userData.messageId);
            await message.edit({ embeds: [embed], components: buttons });
            updateSuccessful = true;
          }
        } catch (error) {
          console.error('Error updating todo message:', error);
        }

        // Silently acknowledge the interaction without showing a message
        if (updateSuccessful) {
          await interaction.deferUpdate();
        } else {
          await interaction.reply({
            content: '✅ Task added. Run `/todo` to refresh the list.',
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error('[TODO] Error adding task:', error);
        await interaction.reply({
          content: `❌ Failed to add task: ${error.message}\n\nThe bot may need to be redeployed with the latest Convex database changes.`,
          ephemeral: true,
        });
      }
      return;
    }
  }

  // Handle select menu interactions (dropdown)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'todo_select_task') {
      // Check admin permissions
      const isAdmin = interaction.member.permissions.has('Administrator');

      if (!isAdmin) {
        await interaction.reply({
          content: '❌ Only administrators can modify the todo list.',
          ephemeral: true,
        });
        return;
      }

      const userData = await getTodoData();
      const taskNumber = parseInt(interaction.values[0]);

      if (userData.mode === 'complete' || userData.mode === 'uncomplete') {
        await toggleTask(taskNumber);
      } else if (userData.mode === 'delete') {
        await deleteTask(taskNumber);
      }

      const updatedData = await getTodoData();
      const embed = buildTodoEmbed(updatedData);
      const buttons = buildTodoButtons(updatedData, true);

      await interaction.update({ embeds: [embed], components: buttons });
      return;
    }

    if (interaction.customId === 'unlinkwallet_select') {
      const selectedWallet = interaction.values[0];

      await convex.mutation('discordIntegration:unlinkDiscordFromWallet', {
        walletAddress: selectedWallet,
        guildId: GUILD_ID,
      });

      await interaction.update({
        content: `✅ Successfully unlinked wallet \`${selectedWallet.substring(0, 12)}...${selectedWallet.slice(-8)}\``,
        components: [],
      });

      // Clean up nickname if no more wallets
      const remainingWallets = await convex.query('discordIntegration:getUserWallets', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (!remainingWallets || remainingWallets.length === 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const currentNickname = member.nickname || member.user.username;
        const cleanNickname = currentNickname.replace(/[🥉🥈🥇💎💠👑⚡]/g, '').trim();

        if (cleanNickname !== currentNickname) {
          await member.setNickname(cleanNickname);
        }
      }

      return;
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    // Todo list button interactions
    if (interaction.customId.startsWith('todo_')) {
      // Check admin permissions
      const isAdmin = interaction.member.permissions.has('Administrator');

      if (!isAdmin) {
        await interaction.reply({
          content: '❌ Only administrators can modify the todo list.',
          ephemeral: true,
        });
        return;
      }

      const userData = await getTodoData();

      if (interaction.customId === 'todo_add') {
        const modal = new ModalBuilder()
          .setCustomId('todo_add_modal')
          .setTitle('Add New Task');

        const taskInput = new TextInputBuilder()
          .setCustomId('task_input')
          .setLabel('Task Description')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Enter your task here...')
          .setMaxLength(500)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(taskInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === 'todo_mode_complete') {
        await setMode('complete');
      } else if (interaction.customId === 'todo_mode_uncomplete') {
        await setMode('uncomplete');
      } else if (interaction.customId === 'todo_mode_delete') {
        await setMode('delete');
      } else if (interaction.customId === 'todo_mode_view') {
        await setMode('view');
      } else if (interaction.customId === 'todo_clear') {
        await clearCompleted();
      }

      const updatedData = await getTodoData();
      const embed = buildTodoEmbed(updatedData);
      const buttons = buildTodoButtons(updatedData, true);

      await interaction.update({ embeds: [embed], components: buttons });
      return;
    }

    return;
  }

  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'linkwallet') {
      await interaction.deferReply({ ephemeral: true });

      let walletAddress = interaction.options.getString('wallet')?.trim();
      const walletNickname = interaction.options.getString('nickname')?.trim();
      const discordUserId = interaction.user.id;
      const discordUsername = interaction.user.username;

      console.log('[LINKWALLET] Raw wallet input:', walletAddress);
      console.log('[LINKWALLET] Wallet length:', walletAddress?.length);
      console.log('[LINKWALLET] Nickname:', walletNickname);
      console.log('[LINKWALLET] Discord user:', discordUserId, discordUsername);

      // Basic validation
      if (!walletAddress || walletAddress.length < 50) {
        await interaction.editReply({
          content: `❌ Invalid wallet address. Cardano addresses must be at least 50 characters. You provided ${walletAddress?.length || 0} characters.`,
        });
        return;
      }

      const conversion = await convex.action('discordIntegration:convertPaymentToStakeAddress', {
        address: walletAddress,
      });

      if (conversion.isPaymentAddress && conversion.stakeAddress) {
        walletAddress = conversion.stakeAddress;
        await interaction.editReply({
          content: `🔄 Converted payment address to stake address: \`${walletAddress.substring(0, 20)}...\`\nLinking to your Discord account...`,
        });
      } else if (conversion.isPaymentAddress && !conversion.stakeAddress) {
        await interaction.editReply({
          content: `❌ Could not convert payment address to stake address. Please use your stake address instead.\n\nYou can find your stake address in your wallet settings.`,
        });
        return;
      }

      console.log('[LINKWALLET] About to call mutation with wallet:', walletAddress);
      console.log('[LINKWALLET] Wallet length before mutation:', walletAddress?.length);

      const result = await convex.mutation('discordIntegration:linkDiscordToWallet', {
        walletAddress,
        discordUserId,
        discordUsername,
        guildId: GUILD_ID,
        walletNickname,
      });

      console.log('[LINKWALLET] Mutation completed:', result);

      const walletDisplay = walletNickname || `\`${walletAddress.substring(0, 20)}...\``;
      const isPrimaryText = result.isPrimary ? ' (set as primary wallet)' : '';
      const actionText = result.isNewWallet ? 'linked' : 'reactivated';

      await interaction.editReply({
        content: `✅ Successfully ${actionText} wallet ${walletDisplay} to your Discord account${isPrimaryText}!`,
      });

      setTimeout(async () => {
        await syncAllNicknames();
      }, 2000);
    }

    if (commandName === 'unlinkwallet') {
      const wallets = await convex.query('discordIntegration:getUserWallets', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (!wallets || wallets.length === 0) {
        await interaction.reply({
          content: '❌ No wallets linked to your Discord account.',
          ephemeral: true,
        });
        return;
      }

      if (wallets.length === 1) {
        // If only one wallet, unlink it directly
        await convex.mutation('discordIntegration:unlinkDiscordFromWallet', {
          walletAddress: wallets[0].walletAddress,
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
        return;
      }

      // Multiple wallets - show dropdown
      const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('unlinkwallet_select')
        .setPlaceholder('Select a wallet to unlink')
        .addOptions(
          wallets.map(wallet => {
            const isPrimaryLabel = wallet.isPrimary ? ' ⭐ (Primary)' : '';
            const label = wallet.walletNickname
              ? `${wallet.walletNickname}${isPrimaryLabel}`
              : `${wallet.walletAddress.substring(0, 12)}...${wallet.walletAddress.slice(-8)}${isPrimaryLabel}`;

            return new StringSelectMenuOptionBuilder()
              .setLabel(label)
              .setValue(wallet.walletAddress)
              .setDescription(`Linked: ${new Date(wallet.linkedAt).toLocaleDateString()}`);
          })
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: `You have ${wallets.length} wallets linked. Select one to unlink:`,
        components: [row],
        ephemeral: true,
      });
    }

    if (commandName === 'mygold') {
      const goldData = await convex.query('discordIntegration:getUserGoldAndEmoji', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (goldData.walletCount === 0) {
        await interaction.reply({
          content: '❌ No wallet linked. Use `/linkwallet` to link your Cardano wallet.',
          ephemeral: true,
        });
        return;
      }

      let highestEarnerText = 'None';
      if (goldData.highestEarner) {
        highestEarnerText = `**${goldData.highestEarner.assetName}** - ${goldData.highestEarner.goldPerHour.toFixed(2)} gold/hr` +
          (goldData.highestEarner.rarityRank ? ` (Rank #${goldData.highestEarner.rarityRank})` : '');
      }

      const walletText = goldData.walletCount === 1
        ? 'Use `/wallets` to view your linked wallet.'
        : `Across ${goldData.walletCount} wallets. Use \`/wallets\` to view them.`;

      await interaction.reply({
        content: `💰 **Your Gold Stats**\n\n` +
          `**Total Gold:** ${goldData.gold.toLocaleString()}\n` +
          `**Gold per Hour:** ${goldData.goldPerHour.toFixed(2)}\n` +
          `**Tier:** ${goldData.tierName} ${goldData.emoji}\n` +
          `**Highest Earner:** ${highestEarnerText}\n\n` +
          `${walletText}`,
        ephemeral: true,
      });
    }

    if (commandName === 'wallets') {
      const wallets = await convex.query('discordIntegration:getUserWallets', {
        discordUserId: interaction.user.id,
        guildId: GUILD_ID,
      });

      if (!wallets || wallets.length === 0) {
        await interaction.reply({
          content: '❌ No wallets linked to your Discord account. Use `/linkwallet` to link a wallet.',
          ephemeral: true,
        });
        return;
      }

      let walletList = `📱 **Your Linked Wallets** (${wallets.length})\n\n`;

      wallets.forEach((wallet, index) => {
        const primaryBadge = wallet.isPrimary ? '⭐ **Primary** ' : '';
        const nickname = wallet.walletNickname ? `**${wallet.walletNickname}**` : `Wallet ${index + 1}`;
        const shortAddress = `\`${wallet.walletAddress.substring(0, 12)}...${wallet.walletAddress.slice(-8)}\``;
        const linkedDate = new Date(wallet.linkedAt).toLocaleDateString();

        walletList += `${index + 1}. ${primaryBadge}${nickname}\n`;
        walletList += `   ${shortAddress}\n`;
        walletList += `   Linked: ${linkedDate}\n\n`;
      });

      walletList += `\nTo manage your wallets:\n`;
      walletList += `• Use \`/linkwallet\` to add more wallets\n`;
      walletList += `• Use \`/unlinkwallet\` to remove a wallet`;

      await interaction.reply({
        content: walletList,
        ephemeral: true,
      });
    }

    if (commandName === 'corp') {
      try {
        console.log('[CORP] Command triggered by:', interaction.user.username, 'ID:', interaction.user.id);

        const isHidden = interaction.options.getBoolean('hidden') ?? false;
        console.log('[CORP] Hidden mode:', isHidden);

        await interaction.deferReply({ ephemeral: isHidden });
        console.log('[CORP] Reply deferred');

        // Get the user's Discord connection
        console.log('[CORP] Querying for Discord connection...');
        const connection = await convex.query('discordIntegration:getDiscordConnectionByDiscordUser', {
          discordUserId: interaction.user.id,
          guildId: GUILD_ID,
        });
        console.log('[CORP] Connection result:', connection ? 'Found' : 'Not found');
        if (connection) {
          console.log('[CORP] Wallet address:', connection.walletAddress);
        }

        if (!connection) {
          console.log('[CORP] No wallet linked - returning error');
          await interaction.editReply({
            content: '❌ No wallet linked. Use `/linkwallet` to link your Cardano wallet first.',
          });
          return;
        }

        // Fetch corporation data from our existing public query
        console.log('[CORP] Fetching corporation data for:', connection.walletAddress);
        const corpData = await convex.query('publicCorporation:getCorporationData', {
          identifier: connection.walletAddress,
        });
        console.log('[CORP] Corp data result:', corpData ? 'Found' : 'null');
        if (corpData) {
          console.log('[CORP] Corp data:', {
            companyName: corpData.companyName,
            mekCount: corpData.mekCount,
            goldPerHour: corpData.goldPerHour,
          });
        }

        if (!corpData) {
          console.log('[CORP] No corp data - returning error');
          await interaction.editReply({
            content: '❌ Could not load corporation data. Please try again later.',
          });
          return;
        }

        // Generate custom corporation image
        console.log('[CORP] Generating corporation image...');
        const imageBuffer = await generateCorporationImage(corpData, interaction.user.username);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'corporation.png' });
        console.log('[CORP] Image generated successfully');

        const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3100';

        // TEMPORARY: Removed embed to show plain attachment
        // const embed = new EmbedBuilder()
        //   .setImage('attachment://corporation.png')
        //   .setColor(0xFAB617);

        // Create button row
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('Complete Workforce')
              .setEmoji('📊')
              .setURL(`${websiteUrl}/corp/${encodeURIComponent(corpData.companyName)}`)
              .setStyle(ButtonStyle.Link)
          );

        await interaction.editReply({
          // embeds: [embed],  // COMMENTED OUT - showing plain attachment
          files: [attachment],
          components: [row],
        });
        console.log('[CORP] Command completed successfully');
      } catch (error) {
        console.error('[CORP] ERROR:', error);
        console.error('[CORP] Error stack:', error.stack);
        try {
          await interaction.editReply({
            content: '❌ An error occurred while fetching corporation data. Please try again later.',
          });
        } catch (replyError) {
          console.error('[CORP] Could not send error reply:', replyError);
        }
      }
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

    if (commandName === 'todo') {
      const isAdmin = interaction.member.permissions.has('Administrator');
      const userData = await getTodoData();

      console.log('[TODO] Current stored message ID:', userData.messageId);
      console.log('[TODO] Current stored channel ID:', userData.channelId);

      const embed = buildTodoEmbed(userData);
      const buttons = buildTodoButtons(userData, isAdmin);

      // Try to update existing message first
      if (userData.messageId && userData.channelId) {
        try {
          console.log('[TODO] Attempting to update existing message...');
          const channel = await client.channels.fetch(userData.channelId);
          const message = await channel.messages.fetch(userData.messageId);

          await message.edit({ embeds: [embed], components: buttons });
          console.log('[TODO] Successfully updated existing message');

          await interaction.deferReply({ ephemeral: true });
          await interaction.deleteReply();
          return;
        } catch (error) {
          console.log('[TODO] Could not find/edit existing message, creating new one:', error.message);
          // Clear the stored message info since it's invalid
          await setMessageInfo(null, null);
        }
      } else {
        console.log('[TODO] No existing message found, will create new one');
      }

      // Create new regular message (not interaction reply)
      try {
        console.log('[TODO] Creating new message...');
        const message = await interaction.channel.send({
          embeds: [embed],
          components: buttons,
        });

        console.log('[TODO] New message created with ID:', message.id);
        console.log('[TODO] Saving message info...');
        await setMessageInfo(message.id, message.channel.id);
        console.log('[TODO] Message info saved successfully');

        // Silently acknowledge without showing a message
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
      } catch (error) {
        console.error('[TODO] Failed to create message:', error.message);
        await interaction.reply({
          content: '❌ I don\'t have permission to send messages in this channel. Please check my bot permissions:\n' +
                   '• View Channel\n' +
                   '• Send Messages\n' +
                   '• Embed Links\n' +
                   '• Read Message History',
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    try {
      await interaction.reply({
        content: '❌ An error occurred while processing your command.',
        ephemeral: true,
      });
    } catch (replyError) {
      console.error('Could not send error reply:', replyError);
    }
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