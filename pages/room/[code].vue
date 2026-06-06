<template>
  <div class="min-h-screen pb-16">
    <div v-if="room" class="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
      <div v-if="!playerId" class="text-center space-y-4">
        <GameCard>
          <div class="text-center space-y-4">
            <div class="text-5xl">🍥</div>
            <h3 class="text-xl font-bold text-white">Rejoindre la partie</h3>
            <p class="text-gray-400">
              Code: <span class="font-mono text-2xl font-bold text-ninja-400">{{ room.code }}</span>
            </p>
            <div>
              <label class="game-label">Pseudo</label>
              <input v-model="joinName" placeholder="Entrez votre pseudo" class="game-input" />
            </div>
            <GameButton block size="lg" :disabled="joinName.trim().length < 2" :loading="joining" @click="handleJoinRoom">
              🎮 Rejoindre
            </GameButton>
            <p v-if="joinError" class="text-sm text-akatsuki-400 font-semibold">{{ joinError }}</p>
            <GameButton variant="ghost" block @click="navigateTo('/')">
              ← Retour
            </GameButton>
          </div>
        </GameCard>
      </div>

      <template v-else>
        <div class="text-center space-y-2">
          <div class="text-4xl animate-float">🍃</div>
          <h1 class="text-3xl font-black text-white">Salle d'attente</h1>
          <p class="text-gray-400">
            Code: <span class="font-mono text-2xl font-bold text-ninja-400">{{ room.code }}</span>
          </p>
        </div>

        <LobbyPlayerList :room="room" :player-id="playerId" :is-host="isHost" @kick="handleKick" />

        <div v-if="lastGameResult" class="game-card animate-slide-up">
          <div class="game-card__body space-y-4 text-center">
            <h2 class="text-xl font-black text-white">
              {{ lastGameResult.winner === 'civilians' ? '🏆 Les civils ont gagné !' : '👺 Les Undercover ont gagné !' }}
            </h2>

            <div class="p-4 rounded-xl bg-white/5 space-y-1">
              <p class="text-sm text-gray-400">Mot des civils : <span class="text-ninja-400 font-bold">{{ lastGameResult.wordA }}</span></p>
              <p class="text-sm text-gray-400">Mot des imposteurs : <span class="text-akatsuki-400 font-bold">{{ lastGameResult.wordB }}</span></p>
            </div>

            <div class="space-y-2">
              <p class="game-label text-center">Rôles</p>
              <div v-for="p in lastGameResult.exposed" :key="p.playerId"
                class="p-3 rounded-xl text-sm font-bold"
                :class="p.role === 'undercover' || p.role === 'mrWhite'
                  ? 'bg-akatsuki-900/30 ring-1 ring-akatsuki-500/30 text-akatsuki-300'
                  : 'bg-leaf-900/30 ring-1 ring-leaf-500/30 text-leaf-300'">
                <p>{{ p.name }} — {{ p.role === 'undercover' ? 'Undercover' : p.role === 'mrWhite' ? 'Mr. White' : 'Civil' }}</p>
                <p v-if="p.word" class="text-xs opacity-70">Mot : {{ p.word }}</p>
              </div>
            </div>

            <p class="text-sm text-gray-500">
              🏅 Civils {{ lastGameResult.scores.civilians }} - {{ lastGameResult.scores.undercover }} Undercover
            </p>
          </div>
        </div>

        <LobbyInviteLink :room="room" />

        <LobbyGameSettings v-if="isHost" :is-host="isHost" :player-count="playerCount" :config="lastConfig ?? undefined" @start="handleStart" />

        <div v-if="!isHost" class="text-center">
          <p class="text-gray-500 animate-pulse">⏳ En attente que l'hôte lance la partie...</p>
        </div>

        <div class="text-center">
          <GameButton variant="ghost" @click="handleLeave">🚪 Quitter la salle</GameButton>
        </div>
      </template>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-500">Chargement...</p>
      <GameButton class="mt-4" variant="secondary" @click="navigateTo('/')">← Retour</GameButton>
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
    // No toast available without Nuxt UI — just ignore silently
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
