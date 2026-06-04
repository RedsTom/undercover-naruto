<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-8">
      <div v-if="room && gameState" class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Partie en cours</h1>
          <UButton color="gray" variant="outline" size="sm" @click="handleLeave">Quitter</UButton>
        </div>

        <div class="text-center space-y-1">
          <p class="text-lg text-gray-600 dark:text-gray-300">
            Phase : <span class="font-semibold capitalize">{{ phaseLabel }}</span>
          </p>
          <p class="text-sm text-gray-400">Round {{ gameState.currentRound }}</p>
          <GameTimer v-if="gameState.timerEndTime" :end-time="gameState.timerEndTime" :label="timerLabel" />
        </div>

        <div v-if="myWord" class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <p class="text-sm text-gray-500 mb-1">Votre mot :</p>
          <p class="text-3xl font-bold text-orange-600">{{ myWord }}</p>
          <p v-if="!hideRole" class="text-xs text-gray-400 mt-1">Rôle : {{ myRole === 'civil' ? 'Civil' : myRole === 'undercover' ? 'Undercover' : 'Mr. White' }}</p>
          <div v-if="wordInfo" class="mt-4 text-left border-t pt-4">
            <p class="text-sm text-gray-600 dark:text-gray-400 italic">{{ wordInfo.summary }}</p>
            <ul class="mt-2 space-y-1">
              <li v-for="(detail, i) in wordInfo.details" :key="i" class="text-xs text-gray-500 flex gap-2">
                <span class="text-orange-400 shrink-0">•</span>
                <span>{{ detail }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="player in room.players" :key="player.id"
            class="p-3 rounded-lg text-center relative"
            :class="playerClasses(player)">
            <p class="font-medium">{{ player.name }}</p>
            <p v-if="!player.isAlive" class="text-xs text-red-500">Éliminé</p>
            <p v-if="player.id === playerId" class="text-xs text-orange-500">Vous</p>
            <p v-if="isCurrentSpeaker(player.id) && gameState.phase === 'discussion'" class="text-xs text-green-600 font-semibold mt-1">🔊 En train de parler</p>
          </div>
        </div>

        <div v-if="gameState.phase === 'discussion'" class="text-center space-y-3">
          <p v-if="currentSpeaker" class="text-lg">
            Tour de <strong>{{ currentSpeaker.name }}</strong>
          </p>
          <p class="text-sm text-gray-500">Décrivez votre mot sans être trop explicite</p>
          <div v-if="isHost" class="flex gap-3 justify-center">
            <UButton @click="handleNextTurn">Tour suivant</UButton>
            <UButton color="red" variant="outline" @click="handleStartVoting">Passer au vote</UButton>
          </div>
        </div>

        <div v-if="gameState.phase === 'voting' && myRole" class="space-y-3">
          <h2 class="text-lg font-semibold text-center">Votez pour éliminer un joueur</h2>
          <div class="grid grid-cols-2 gap-2">
            <UButton v-for="player in alivePlayers" :key="player.id"
              :disabled="player.id === playerId || voting"
              block
              @click="handleVote(player.id)">
              {{ player.name }}
            </UButton>
          </div>
        </div>

        <div v-if="gameState.phase === 'reveal' && isHost" class="text-center">
          <UButton size="lg" @click="handleNextRound">Tour suivant</UButton>
        </div>

        <div v-if="gameState.phase === 'finished'" class="text-center space-y-4">
          <h2 class="text-2xl font-bold">{{ winnerText }}</h2>
          <p v-if="gameState.scores" class="text-gray-500">
            Civils {{ gameState.scores.civilians }} - {{ gameState.scores.undercover }} Undercover
          </p>
        </div>
      </div>

      <div v-else class="text-center">
        <p class="text-gray-500">Chargement...</p>
        <UButton class="mt-4" @click="navigateTo('/')">Retour à l'accueil</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWordInfo } from '~/utils/wordInfo';

const route = useRoute();
const { room, playerId, isHost, fetchRoom, cleanup } = useRoomAPI();
const { myWord, myRole, fetchMyInfo, vote, nextTurn, startVoting, nextRound } = useGameAPI();
const { connect, disconnect } = useSSE();

const voting = ref(false);

const gameState = computed(() => (room.value as any)?.gameState ?? null);

const hideRole = computed(() => (gameState.value as any)?.config?.hideRole ?? false);

const wordInfo = computed(() => {
  if (!myWord.value) return null;
  return getWordInfo(myWord.value) ?? null;
});

const phaseLabel = computed(() => {
  const phases: Record<string, string> = {
    discussion: 'Discussion',
    voting: 'Vote',
    reveal: 'Révélation',
    finished: 'Fin',
  };
  return phases[gameState.value?.phase] || gameState.value?.phase || 'En attente';
});

const winnerText = computed(() => {
  if (!gameState.value?.winner) return 'Partie terminée !';
  return gameState.value.winner === 'civilians' ? 'Les civils ont gagné !' : 'Les Undercover ont gagné !';
});

const timerLabel = computed(() => {
  if (gameState.value?.phase === 'discussion') return 'Temps de discussion restant';
  if (gameState.value?.phase === 'voting') return 'Temps de vote restant';
  return 'Temps restant';
});

const alivePlayers = computed(() => {
  if (!room.value) return [];
  return room.value.players.filter((p: any) => p.isAlive && p.id !== playerId.value);
});

const aliveAll = computed(() => {
  if (!room.value) return [];
  return room.value.players.filter((p: any) => p.isAlive);
});

const currentSpeaker = computed(() => {
  if (!gameState.value || gameState.value.phase !== 'discussion') return null;
  const idx = gameState.value.currentTurnIndex;
  const players = aliveAll.value;
  return players[idx] ?? null;
});

function isCurrentSpeaker(playerId: string): boolean {
  return currentSpeaker.value?.id === playerId;
}

function playerClasses(player: any): string {
  if (!player.isAlive) return 'bg-gray-200 dark:bg-gray-700 opacity-50';
  if (isCurrentSpeaker(player.id) && gameState.value?.phase === 'discussion') return 'bg-green-50 dark:bg-green-900 ring-2 ring-green-500';
  return 'bg-white dark:bg-gray-800';
}

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

  if (room.value) {
    connect(room.value.id);
    await fetchMyInfo();
    pollInterval = setInterval(async () => {
      if (room.value) {
        await fetchRoom(room.value.id);
        await fetchMyInfo();
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

async function handleNextTurn() {
  await nextTurn();
}

async function handleStartVoting() {
  await startVoting();
}

async function handleVote(targetId: string) {
  voting.value = true;
  await vote(targetId);
  voting.value = false;
}

async function handleNextRound() {
  await nextRound();
  await fetchMyInfo();
}

function handleLeave() {
  disconnect();
  cleanup();
  navigateTo('/');
}
</script>