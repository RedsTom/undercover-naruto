import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const APP_URL = process.env.APP_URL || 'https://undercover.vps.redstom.fr';

let client: Client | null = null;

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID) return;
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const existing = await rest.get(Routes.applicationCommands(CLIENT_ID)) as any[];
    const names = new Set(existing.map((c: any) => c.name));

    if (!names.has('undercover')) {
      existing.push({
        name: 'undercover',
        description: 'Lancer une partie Undercover',
      });
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: existing });
      console.log('[DiscordBot] Slash command /undercover registered');
    } else {
      console.log('[DiscordBot] Slash command /undercover already registered');
    }
  } catch (e) {
    console.error('[DiscordBot] Failed to register command:', e);
  }
}

export function startBot() {
  if (!TOKEN) {
    console.log('[DiscordBot] DISCORD_BOT_TOKEN not set, skipping');
    return;
  }
  if (!CLIENT_ID) {
    console.log('[DiscordBot] DISCORD_CLIENT_ID not set, skipping');
    return;
  }
  if (client) return;

  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('ready', async () => {
    console.log(`[DiscordBot] Connected as ${client?.user?.tag}`);
    await registerCommands();
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'undercover') return;

    const embed = new EmbedBuilder()
      .setTitle('Undercover — Anime Edition')
      .setDescription("Trouvez l'intrus avant qu'il ne soit trop tard !")
      .setColor(0xf97316)
      .addFields(
        { name: '👥 Joueurs', value: 'De 3 à 8 joueurs', inline: true },
        { name: '🎭 Rôles', value: 'Civils, Undercover, Mr.White', inline: true },
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('🎮 Lancer le jeu')
        .setURL(`${APP_URL}/discord`),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  });

  client.on('error', (e) => {
    console.error('[DiscordBot] Client error:', e);
  });

  client.login(TOKEN).catch((e) => {
    console.error('[DiscordBot] Login failed:', e);
    client = null;
  });
}

export function stopBot() {
  if (client) {
    client.destroy();
    client = null;
    console.log('[DiscordBot] Stopped');
  }
}
