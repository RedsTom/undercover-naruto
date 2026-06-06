<template>
  <div class="min-h-screen pb-16">
    <div v-if="room" class="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
      <div v-if="!playerId" class="text-center space-y-4">
        <GameCard>
          <form @submit.prevent="handleJoinRoom" class="text-center space-y-4">
            <div class="text-5xl">&#127841;</div>
            <h3 class="text-xl font-bold text-white">Rejoindre la partie</h3>
            <p class="text-gray-400">
              Code: <span class="font-mono text-2xl font-bold text-orange-400">{{ room.code }}</span>
            </p>
            <div class="flex flex-col gap-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-white/50">Pseudo</label>
              <input v-model="joinName" placeholder="Entrez votre pseudo" autocomplete="off" class="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border placeholder:text-white/25 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" />
            </div>
            <GameButton type="submit" block size="lg" :disabled="joinName.trim().length < 2" :loading="joining">
              &#127918; Rejoindre
            </GameButton>
            <p v-if="joinError" class="text-sm text-red-400 font-semibold">{{ joinError }}</p>
          </form>
          <div class="mt-2">
            <GameButton variant="ghost" block @click="navigateTo('/')">&#8592; Retour</GameButton>
          </div>
        </GameCard>
      </div>

      <template v-else>
        <div class="text-center space-y-2">
          <div class="text-4xl animate-float">&#127807;</div>
          <h1 class="text-3xl font-black text-white">Salle d'attente</h1>
          <p class="text-gray-400">
            Code: <span class="font-mono text-2xl font-bold text-orange-400">{{ room.code }}</span>
          </p>
        </div>

        <PlayerList :room="room" :player-id="playerId" :is-host="isHost" @kick="handleKick" />

        <div v-if="isInGame" class="animate-slide-up">
          <GameCard>
            <div class="space-y-3 text-center">
              <p class="text-sm text-gray-400">
                Round <span class="text-orange-400 font-bold">{{ gameState.currentRound }}</span>
              </p>
              <div class="flex justify-center gap-6">
                <div class="text-center">
                  <p class="text-2xl font-black text-orange-400">{{ gameState.scores.civilians }}</p>
                  <p class="text-xs text-gray-400">Civils</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-black text-red-400">{{ gameState.scores.undercover }}</p>
                  <p class="text-xs text-gray-400">Undercover</p>
                </div>
              </div>
              <p v-if="!isHost" class="text-sm text-gray-500 animate-pulse">&#9203; En attente que l'hôte lance le tour suivant...</p>
            </div>
          </GameCard>
        </div>

        <div v-if="lastGameResult" class="animate-slide-up">
          <GameCard>
            <div class="space-y-4 text-center">
              <h2 class="text-xl font-black text-white">
                {{ lastGameResult.winner === 'civilians' ? '&#127942; Les civils ont gagné !' : '&#128120; Les Undercover ont gagné !' }}
              </h2>

              <div class="p-4 rounded-xl bg-white/5 space-y-1">
                <p class="text-sm text-gray-400">Mot des civils : <span class="text-orange-400 font-bold">{{ lastGameResult.wordA }}</span></p>
                <p class="text-sm text-gray-400">Mot des imposteurs : <span class="text-red-400 font-bold">{{ lastGameResult.wordB }}</span></p>
              </div>

              <div class="space-y-2">
                <p class="block text-xs font-bold uppercase tracking-wider text-white/50 text-center">Rôles</p>
                <div v-for="p in lastGameResult.exposed" :key="p.playerId"
                  class="p-3 rounded-xl text-sm font-bold"
                  :class="p.role === 'undercover' || p.role === 'mrWhite'
                    ? 'bg-red-900/30 ring-1 ring-red-500/30 text-red-300'
                    : 'bg-green-900/30 ring-1 ring-green-500/30 text-green-300'">
                  <p>{{ p.name }} — {{ p.role === 'undercover' ? 'Undercover' : p.role === 'mrWhite' ? 'Mr. White' : 'Civil' }}</p>
                  <p v-if="p.word" class="text-xs opacity-70">Mot : {{ p.word }}</p>
                </div>
              </div>

              <p class="text-sm text-gray-500">
                &#127941; Civils {{ lastGameResult.scores.civilians }} - {{ lastGameResult.scores.undercover }} Undercover
              </p>
            </div>
          </GameCard>
        </div>

        <InviteLink :room="room" />

        <GameSettings v-if="isHost" :is-host="isHost" :player-count="playerCount" :config="lastConfig ?? undefined" :in-game="!!isInGame" @start="handleStart" />

        <div v-if="!isHost && !isInGame" class="text-center">
          <p class="text-gray-500 animate-pulse">&#9203; En attente que l'hôte lance la partie...</p>
        </div>

        <div class="text-center">
          <GameButton variant="ghost" @click="handleLeave">&#128682; Quitter la salle</GameButton>
        </div>
      </template>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-500">Chargement...</p>
      <div class="mt-4">
        <GameButton variant="secondary" @click="navigateTo('/')">&#8592; Retour</GameButton>
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

const gameState = computed(() => (room.value as any)?.gameState ?? null);
const isInGame = computed(() => gameState.value && gameState.value.currentRound > 0 && gameState.value.phase === 'waiting');
const lastConfig = computed(() => (room.value as any)?.gameState?.config ?? (room.value as any)?.lastConfig ?? null);
const lastGameResult = computed(() => {
  if (gameState.value?.phase === 'finished') return gameState.value;
  if (!isInGame.value) return (room.value as any)?.lastGameResult ?? null;
  return null;
});

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
