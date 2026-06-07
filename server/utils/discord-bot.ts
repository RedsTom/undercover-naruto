const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const APP_URL = process.env.APP_URL || 'https://undercover.vps.redstom.fr';
const API_VERSION = '10';
const GATEWAY_URL = `wss://gateway.discord.gg/?v=${API_VERSION}&encoding=json`;

let ws: WebSocket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let sequence: number | null = null;
let connected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

interface GatewayPayload {
  op: number;
  d?: any;
  s?: number;
  t?: string;
}

function sendPayload(op: number, data?: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ op, d: data }));
  }
}

function sendHeartbeat() {
  sendPayload(1, sequence);
}

function identify() {
  sendPayload(2, {
    token: TOKEN,
    intents: 0,
    properties: {
      os: 'linux',
      browser: 'undercover',
      device: 'undercover',
    },
  });
}

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID) return;
  try {
    const commands = [
      {
        name: 'undercover',
        description: 'Lancer une partie Undercover',
      },
    ];
    const res = await fetch(
      `https://discord.com/api/v${API_VERSION}/applications/${CLIENT_ID}/commands`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      },
    );
    if (res.ok) {
      console.log('[DiscordBot] Slash command /undercover registered');
    } else {
      const text = await res.text();
      console.error('[DiscordBot] Failed to register command:', text);
    }
  } catch (e) {
    console.error('[DiscordBot] Failed to register command:', e);
  }
}

async function handleInteraction(data: any) {
  const { id, token, type, data: interactionData, member, channel_id } = data;
  if (type !== 2) return;
  const commandName = interactionData?.name;
  if (commandName !== 'undercover') return;

  try {
    const responseData = {
      type: 4,
      data: {
        content: '**Undercover — Anime Edition**',
        embeds: [
          {
            description: 'Trouvez l\'intrus avant qu\'il ne soit trop tard !',
            color: 0xf97316,
            fields: [
              {
                name: '👥 Joueurs',
                value: 'De 3 à 8 joueurs',
                inline: true,
              },
              {
                name: '🎭 Rôles',
                value: 'Civils, Undercover, Mr.White',
                inline: true,
              },
            ],
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: '🎮 Lancer le jeu',
                url: `${APP_URL}/discord`,
              },
            ],
          },
        ],
      },
    };

    await fetch(
      `https://discord.com/api/v${API_VERSION}/interactions/${id}/${token}/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      },
    );
  } catch (e) {
    console.error('[DiscordBot] Failed to handle interaction:', e);
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
  if (connected) return;

  console.log('[DiscordBot] Connecting to Gateway...');
  ws = new WebSocket(GATEWAY_URL);

  ws.onopen = () => {
    console.log('[DiscordBot] Connected');
  };

  ws.onmessage = async (event) => {
    try {
      const payload: GatewayPayload = JSON.parse(event.data as string);
      const { op, d, s, t } = payload;

      if (s) sequence = s;

      switch (op) {
        case 0:
          if (t === 'READY') {
            connected = true;
            console.log('[DiscordBot] Ready as', d?.user?.username);
            await registerCommands();
          } else if (t === 'INTERACTION_CREATE') {
            await handleInteraction(d);
          }
          break;
        case 9:
          console.log('[DiscordBot] Invalid session, re-identifying...');
          setTimeout(identify, 1000);
          break;
        case 10:
          heartbeatInterval = setInterval(sendHeartbeat, d.heartbeat_interval);
          identify();
          break;
        case 11:
          break;
      }
    } catch (e) {
      console.error('[DiscordBot] Error processing message:', e);
    }
  };

  ws.onclose = (event) => {
    connected = false;
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    console.log(`[DiscordBot] Disconnected (code: ${event.code}), reconnecting in 5s`);
    reconnectTimer = setTimeout(startBot, 5000);
  };

  ws.onerror = () => {};
}

export function stopBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (ws) {
    ws.close(1000, 'Shutting down');
    ws = null;
  }
  connected = false;
}
