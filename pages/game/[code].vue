<template>
  <div class="min-h-screen pb-16">
    <div v-if="room && gameState" class="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-white">🎮 Partie</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="game-phase-badge" :class="`game-phase-badge--${gameState.phase}`">{{ phaseLabel }}</span>
            <span class="text-sm text-gray-500">Round {{ gameState.currentRound }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <GameButton v-if="isHost" variant="secondary" size="sm" @click="handleReturnToLobby">
            ← Lobby
          </GameButton>
          <GameButton variant="ghost" size="sm" @click="handleLeave">
            🚪
          </GameButton>
        </div>
      </div>

      <div class="flex items-center justify-center">
        <GameTimer v-if="gameState.timerEndTime" :end-time="gameState.timerEndTime" :label="timerLabel" />
      </div>

      <WordDisplay
        :word="myWord"
        :role="myRole"
        :show-word="!!myWord"
      />

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="player in room.players" :key="player.id"
          class="game-card p-4 text-center transition-all duration-200 cursor-default"
          :class="playerCardClass(player)">
          <div class="text-2xl mb-1">
            {{ player.isAlive ? (isCurrentSpeaker(player.id) && gameState.phase === 'discussion' ? '🎤' : '😶') : '💀' }}
          </div>
          <p class="font-bold text-white text-sm">{{ player.name }}</p>
          <p v-if="player.id === playerId" class="text-xs text-ninja-400 mt-0.5">👤 Vous</p>
          <p v-if="isCurrentSpeaker(player.id) && gameState.phase === 'discussion'" class="text-xs text-leaf-400 font-bold mt-0.5 animate-pulse">🔊 Parle</p>
        </div>
      </div>

      <div v-if="gameState.phase === 'discussion'" class="game-card">
        <div class="game-card__body text-center space-y-4">
          <div v-if="currentSpeaker" class="space-y-1">
            <p class="text-3xl">🎤</p>
            <p class="text-lg text-white font-bold">Tour de {{ currentSpeaker.name }}</p>
          </div>
          <p class="text-sm text-gray-400">Décrivez votre mot sans être trop explicite</p>
          <div v-if="isHost || isCurrentSpeaker(playerId)" class="flex gap-3 justify-center flex-wrap">
            <GameButton @click="handleNextTurn">➡️ Tour suivant</GameButton>
            <GameButton variant="danger" @click="handleStartVoting">🗳️ Passer au vote</GameButton>
          </div>
        </div>
      </div>

      <VotePanel
        v-if="gameState.phase === 'voting' && myRole"
        :players="room.players"
        :player-id="playerId"
        :vote-count="voteProgress.count"
        :vote-total="voteProgress.total"
        :disabled="voting"
        @vote="handleVote"
      />

      <div v-if="gameState.phase === 'reveal' && isHost" class="text-center animate-bounce-in">
        <GameButton variant="primary" size="lg" @click="handleNextRound">
          🎯 Tour suivant
        </GameButton>
      </div>

      <div v-if="gameState.phase === 'finished'" class="text-center py-12 animate-bounce-in">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-3xl font-black text-white mb-2">{{ winnerText }}</h2>
        <p class="text-gray-500">Redirection vers le lobby...</p>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-500">Chargement...</p>
      <GameButton class="mt-4" variant="secondary" @click="navigateTo('/')">← Retour</GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { room, playerId, isHost, fetchRoom, cleanup } = useRoomAPI();
const { myWord, myRole, fetchMyInfo, vote, nextTurn, startVoting, nextRound, returnToLobby, cleanup: gameCleanup } = useGameAPI();
const { connect, disconnect } = useSSE();

const voting = ref(false);

const gameState = computed(() => (room.value as any)?.gameState ?? null);

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

const aliveAll = computed(() => {
  if (!room.value) return [];
  return room.value.players.filter((p: any) => p.isAlive);
});

const voteProgress = computed(() => {
  const rounds = (gameState.value as any)?.rounds;
  if (!rounds?.length) return { count: 0, total: 0 };
  const lastRound = rounds[rounds.length - 1];
  return {
    count: lastRound.votes?.length ?? 0,
    total: aliveAll.value.length,
  };
});

const currentSpeaker = computed(() => {
  if (!gameState.value || gameState.value.phase !== 'discussion') return null;
  const idx = gameState.value.currentTurnIndex;
  const players = aliveAll.value;
  return players[idx] ?? null;
});

function isCurrentSpeaker(pid: string): boolean {
  return currentSpeaker.value?.id === pid;
}

function playerCardClass(player: any): string {
  if (!player.isAlive) return 'opacity-40 ring-1 ring-white/5';
  if (isCurrentSpeaker(player.id) && gameState.value?.phase === 'discussion') return 'ring-2 ring-leaf-500 ninja-glow-green';
  return 'ring-1 ring-white/10';
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
          gameCleanup();
          cleanup();
          disconnect();
          if (pollInterval) clearInterval(pollInterval);
          navigateTo('/');
          return;
        }
        if (room.value?.gameState?.phase === 'finished' || room.value?.gameState?.phase === 'waiting') {
          gameCleanup();
          disconnect();
          if (pollInterval) clearInterval(pollInterval);
          navigateTo(`/room/${route.params.code}`);
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

async function handleReturnToLobby() {
  await returnToLobby();
}

function handleLeave() {
  disconnect();
  cleanup();
  navigateTo('/');
}
</script>
