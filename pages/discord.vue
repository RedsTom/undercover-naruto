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
    const config = await $fetch('/api/config');
    const CLIENT_ID = (config as any).discordClientId;
    if (!CLIENT_ID) {
      error.value = 'Discord non configuré (CLIENT_ID manquant)';
      return;
    }

    if (!window.frameElement) {
      error.value = "Cette page doit être ouverte depuis Discord";
      return;
    }

    status.value = 'Initialisation...';
    discordSdk = new DiscordSDK(CLIENT_ID);
    await withTimeout(discordSdk.ready(), 15000, 'SDK ready()');

    const channelId = discordSdk.channelId;
    if (!channelId) {
      error.value = 'Impossible de récupérer le salon Discord';
      return;
    }

    status.value = 'Authentification...';
    const { code } = await withTimeout(
      discordSdk.commands.authorize({ scopes: ['identify'] }),
      15000,
      'authorize()',
    );

    status.value = 'Création de la salle...';
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
    error.value = e.message || 'Erreur de connexion à Discord';
  }
}

function retry() {
  error.value = '';
  handleAuth();
}

onMounted(handleAuth);
</script>
