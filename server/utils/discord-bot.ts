import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

let client: Client | null = null;

async function registerEntryPoint() {
  if (!TOKEN || !CLIENT_ID) return;
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const existing = await rest.get(Routes.applicationCommands(CLIENT_ID)) as any[];
    const entryPoint = existing.find((c: any) => c.type === 4);

    if (entryPoint) {
      if (entryPoint.name !== 'undercover') {
        await rest.patch(Routes.applicationCommand(CLIENT_ID, entryPoint.id), {
          body: { name: 'undercover' },
        });
        console.log('[DiscordBot] Entry point renamed to /undercover');
      } else {
        console.log('[DiscordBot] Entry point /undercover already exists');
      }
      return;
    }

    const oldRegular = existing.find((c: any) => c.name === 'undercover' && c.type === 1);
    if (oldRegular) {
      await rest.delete(Routes.applicationCommand(CLIENT_ID, oldRegular.id));
    }

    await rest.post(Routes.applicationCommands(CLIENT_ID), {
      body: {
        name: 'undercover',
        type: 4,
        handler: 2,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
      },
    });
    console.log('[DiscordBot] Entry point /undercover created');
  } catch (e) {
    console.error('[DiscordBot] Failed to register entry point:', e);
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
    await registerEntryPoint();
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
