<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center space-y-6 animate-slide-up">
      <div class="text-7xl animate-float">&#127841;</div>
      <div v-if="error" class="space-y-4">
        <div class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          <div class="p-6">
            <div class="flex items-center gap-3 text-red-400 justify-center">
              <span>&#9888;&#65039;</span>
              <span class="text-sm font-semibold">{{ error }}</span>
            </div>
            <div v-if="debug" class="mt-4 text-left text-xs text-gray-400 font-mono space-y-1">
              <div v-for="(line, i) in debug" :key="i">{{ line }}</div>
            </div>
          </div>
        </div>
        <GameButton @click="retry">&#x21BB; Réessayer</GameButton>
        <GameButton variant="ghost" @click="navigateTo('/')">&#8592; Retour à l'accueil</GameButton>
      </div>
      <div v-else class="space-y-3">
        <p class="text-lg text-white font-semibold">{{ status }}</p>
        <div class="flex justify-center">
          <div class="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DiscordSDK } from '@discord/embedded-app-sdk';

const router = useRouter();
const { setRoom, playerName } = useRoomAPI();

const status = ref('Connexion à Discord...');
const error = ref('');
const debug = ref<string[]>([]);

function log(...args: any[]) {
  debug.value.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
}

let discordSdk: DiscordSDK | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms),
    ),
  ]);
}

async function handleAuth() {
  try {
    log('URL:', window.location.href);
    log('Origin:', window.location.origin);
    log('Path:', window.location.pathname);
    log('Search:', window.location.search);
    log('In iframe:', window.self !== window.top);

    const urlParams = new URL(window.location.href).searchParams;
    const frameId = urlParams.get('frame_id');
    const instanceId = urlParams.get('instance_id');
    if (frameId) sessionStorage.setItem('discord_frame_id', frameId);
    if (instanceId) sessionStorage.setItem('discord_instance_id', instanceId);

    const config = await $fetch('/api/config');
    log('/api/config response:', config);
    const CLIENT_ID = (config as any).discordClientId;
    log('CLIENT_ID:', CLIENT_ID);
    if (!CLIENT_ID) {
      error.value = 'Discord non configuré (CLIENT_ID manquant)';
      return;
    }

    if (window.self === window.top) {
      error.value = "Cette page doit être ouverte depuis Discord";
      return;
    }

    const url = new URL(window.location.href);
    let needsReload = false;
    for (const [key, storageKey] of [['frame_id', 'discord_frame_id'], ['instance_id', 'discord_instance_id']] as const) {
      if (!url.searchParams.has(key)) {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          url.searchParams.set(key, saved);
          needsReload = true;
        }
      }
    }
    if (needsReload) {
      window.history.replaceState({}, '', url.toString());
    }

    status.value = 'Initialisation...';
    log('Creating DiscordSDK with CLIENT_ID:', CLIENT_ID);

    let sdk;
    try {
      sdk = new DiscordSDK(CLIENT_ID);
      log('SDK constructor OK');
    } catch (c: any) {
      log('SDK constructor threw:', c.name, c.message, c.code, c.stack);
      if (c.message?.includes('frame_id') || c.message?.includes('instance_id')) {
        error.value = 'Connexion Discord impossible : paramètres manquants. Veuillez rouvrir l\'activité depuis Discord.';
        return;
      }
      throw c;
    }
    discordSdk = sdk;
    log('SDK instanceId:', discordSdk.instanceId);
    log('SDK channelId:', discordSdk.channelId);
    log('SDK guildId:', discordSdk.guildId);
    log('SDK frameId:', (discordSdk as any).frameId);
    log('Calling SDK ready()...');
    try {
      await withTimeout(discordSdk.ready(), 15000, 'SDK ready()');
      log('SDK ready() resolved');
    } catch (r: any) {
      log('SDK ready() threw:', r.name, r.message, r.code, r.stack);
      throw r;
    }
    const channelId = discordSdk.channelId;
    if (!channelId) {
      error.value = 'Impossible de récupérer le salon Discord';
      return;
    }

    status.value = 'Authentification...';
    log('Calling authorize() with correct params...');
    const { code } = await withTimeout(
      discordSdk.commands.authorize({
        client_id: CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify'],
      }),
      15000,
      'authorize()',
    );
    log('authorize() got code:', code);

    status.value = 'Échange du code...';
    const data = await $fetch('/api/discord/auth', {
      method: 'POST',
      body: { code, channelId },
    });

    const result = data as any;
    if (result.success) {
      setRoom(result.room, result.playerId);
      playerName.value = result.user.username;
      await router.push(`/room/${result.roomCode}`);
    } else {
      error.value = 'Erreur lors de la connexion au salon';
    }
  } catch (e: any) {
    log('Error name:', e?.name);
    log('Error message:', e?.message);
    log('Error code:', e?.code);
    log('Error stack:', e?.stack);
    log('Error constructor:', e?.constructor?.name);
    log('Error full:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
    error.value = e?.message || e?.toString() || 'Erreur de connexion à Discord';
  }
}

function retry() {
  error.value = '';
  debug.value = [];
  handleAuth();
}

onMounted(handleAuth);
</script>
