<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8">
      <div v-if="room" class="max-w-2xl mx-auto space-y-6">
        <div v-if="!playerId" class="text-center space-y-4">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Rejoindre la partie</h3>
            </template>
            <div class="space-y-4">
              <p class="text-gray-600 dark:text-gray-300">Code: <span class="font-mono text-xl font-bold text-orange-600">{{ room.code }}</span></p>
              <UFormField label="Votre pseudo">
                <UInput v-model="joinName" placeholder="Entrez votre pseudo" size="lg" icon="i-heroicons-user" />
              </UFormField>
              <UButton block size="lg" :disabled="joinName.trim().length < 2" :loading="joining" @click="handleJoinRoom">
                Rejoindre
              </UButton>
              <p v-if="joinError" class="text-sm text-red-500">{{ joinError }}</p>
              <UButton color="gray" variant="outline" block @click="navigateTo('/')">Retour à l'accueil</UButton>
            </div>
          </UCard>
        </div>

        <template v-else>
          <div class="text-center space-y-2">
            <h1 class="text-3xl font-bold">Salle d'attente</h1>
            <p class="text-gray-600 dark:text-gray-300">Code: <span class="font-mono text-2xl font-bold text-orange-600">{{ room.code }}</span></p>
          </div>

          <LobbyInviteLink :room="room" />

          <LobbyPlayerList :room="room" :player-id="playerId" :is-host="isHost" @kick="handleKick" />

          <div v-if="lastGameResult" class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow space-y-4 text-center">
            <h2 class="text-xl font-bold">{{ lastGameResult.winner === 'civilians' ? 'Les civils ont gagné !' : 'Les Undercover ont gagné !' }}</h2>

            <div class="space-y-1">
              <p class="font-semibold">Mot des civils : <span class="text-orange-600">{{ lastGameResult.wordA }}</span></p>
              <p class="font-semibold">Mot des imposteurs : <span class="text-orange-600">{{ lastGameResult.wordB }}</span></p>
            </div>

            <div class="space-y-2">
              <h3 class="text-lg font-semibold">Rôles</h3>
              <div v-for="p in lastGameResult.exposed" :key="p.playerId"
                class="p-3 rounded-lg text-sm"
                :class="p.role === 'undercover' || p.role === 'mrWhite' ? 'bg-red-50 dark:bg-red-900/30 ring-1 ring-red-300' : 'bg-green-50 dark:bg-green-900/30 ring-1 ring-green-300'">
                <p class="font-medium">{{ p.name }}</p>
                <p>{{ p.role === 'undercover' ? 'Undercover' : p.role === 'mrWhite' ? 'Mr. White' : 'Civil' }}</p>
                <p v-if="p.word" class="text-xs text-gray-500">Mot : {{ p.word }}</p>
              </div>
            </div>

            <p class="text-gray-500 text-sm">
              Civils {{ lastGameResult.scores.civilians }} - {{ lastGameResult.scores.undercover }} Undercover
            </p>
          </div>

          <LobbyGameSettings v-if="isHost" :is-host="isHost" :player-count="playerCount" :config="lastConfig ?? undefined" @start="handleStart" />

          <div v-if="!isHost" class="text-center">
            <p class="text-gray-500">En attente que l'hôte lance la partie...</p>
          </div>

          <div class="text-center">
            <UButton color="gray" variant="outline" @click="handleLeave">Quitter la salle</UButton>
          </div>
        </template>
      </div>

      <div v-else class="text-center">
        <p class="text-gray-500">Chargement...</p>
        <UButton class="mt-4" @click="navigateTo('/')">Retour à l'accueil</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameConfig } from '~/types';

const route = useRoute();
const { room, playerId, isHost, playerCount, fetchRoom, cleanup, joinRoom, kickPlayer } = useRoomAPI();
const { startGame, fetchMyInfo } = useGameAPI();
const { connect, disconnect } = useSSE();

const joinName = ref('');
const joining = ref(false);
const joinError = ref('');

const lastConfig = computed(() => (room.value as any)?.gameState?.config ?? (room.value as any)?.lastConfig ?? null);
const lastGameResult = computed(() => (room.value as any)?.gameState?.phase === 'finished' ? (room.value as any)?.gameState : (room.value as any)?.lastGameResult ?? null);

let pollInterval: NodeJS.Timeout | null = null;

onMounted(async () => {
  const code = route.params.code as string;

  try {
    const data = await $fetch(`/api/rooms/code/${code}`);
    room.value = data as any;
  } catch {
    navigateTo('/');
    return;
  }

  if (room.value && playerId.value) {
    connect(room.value.id);
    pollInterval = setInterval(async () => {
      if (room.value && playerId.value) {
        await fetchRoom(room.value.id);
        const stillInRoom = room.value?.players?.some((p: any) => p.id === playerId.value);
        if (!stillInRoom) {
          cleanup();
          disconnect();
          if (pollInterval) clearInterval(pollInterval);
          navigateTo('/');
        }
      }
    }, 3000);
  }
});

onUnmounted(() => {
  disconnect();
  if (pollInterval) clearInterval(pollInterval);
});

watch(() => room.value?.gameState?.phase, (phase) => {
  if (phase && phase !== 'waiting' && phase !== 'finished' && playerId.value) {
    fetchMyInfo();
    navigateTo(`/game/${route.params.code}`);
  }
});

async function handleJoinRoom() {
  if (joinName.value.trim().length < 2) return;
  joining.value = true;
  joinError.value = '';
  try {
    const result = await joinRoom(route.params.code as string, joinName.value.trim());
    if (result.success) {
      connect(room.value!.id);
      pollInterval = setInterval(() => {
        if (room.value) fetchRoom(room.value.id);
      }, 3000);
    } else {
      joinError.value = result.error || 'Impossible de rejoindre';
    }
  } catch {
    joinError.value = 'Erreur de connexion';
  } finally {
    joining.value = false;
  }
}

async function handleKick(targetId: string) {
  const result = await kickPlayer(targetId);
  if (!result.success) {
    useToast().add({ title: 'Erreur', description: result.error, color: 'red' });
  }
}

async function handleStart(config: Partial<GameConfig>) {
  const result = await startGame(config);
  if (result.success) {
    await fetchMyInfo();
    navigateTo(`/game/${route.params.code}`);
  }
}

function handleLeave() {
  disconnect();
  cleanup();
  navigateTo('/');
}
</script>