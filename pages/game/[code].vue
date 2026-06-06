<template>
  <div class="min-h-screen pb-16">
    <div v-if="room && gameState" class="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-white">&#127918; Partie</h1>
          <div class="flex items-center gap-2 mt-1">
            <span :class="phaseBadgeClass">{{ phaseLabel }}</span>
            <span class="text-sm text-gray-500">Round {{ gameState.currentRound }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <GameButton v-if="isHost" variant="secondary" size="sm" @click="handleReturnToLobby">
            &#8592; Lobby
          </GameButton>
          <GameButton variant="ghost" size="sm" @click="handleLeave">
            &#128682;
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
        :anime="animeSlug"
        :hide-role="!!(gameState.value?.config?.hideRole)"
      />

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="player in room.players" :key="player.id"
          class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] p-4 text-center transition-all duration-200 cursor-default"
          :class="playerCardClass(player)">
          <div class="text-2xl mb-1">
            {{ player.isAlive ? (isCurrentSpeaker(player.id) && gameState.phase === 'discussion' ? '&#127908;' : '&#128564;') : '&#128128;' }}
          </div>
          <p class="font-bold text-white text-sm">{{ player.name }}</p>
          <p v-if="player.id === playerId" class="text-xs text-orange-400 mt-0.5">&#128100; Vous</p>
          <p v-if="isCurrentSpeaker(player.id) && gameState.phase === 'discussion'" class="text-xs text-green-400 font-bold mt-0.5 animate-pulse">&#128266; Parle</p>
        </div>
      </div>

      <div v-if="gameState.phase === 'discussion'" class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
        <div class="p-6 text-center space-y-4">
          <div v-if="currentSpeaker" class="space-y-1">
            <p class="text-3xl">&#127908;</p>
            <p class="text-lg text-white font-bold">Tour de {{ currentSpeaker.name }}</p>
          </div>
          <p class="text-sm text-gray-400">Décrivez votre mot sans être trop explicite</p>
          <div v-if="isHost || isCurrentSpeaker(playerId)" class="flex gap-3 justify-center flex-wrap">
            <GameButton @click="handleNextTurn">&#10145;&#65039; Tour suivant</GameButton>
            <GameButton variant="danger" @click="handleStartVoting">&#128499;&#65039; Passer au vote</GameButton>
          </div>
        </div>
      </div>

      <VotePanel
        v-if="gameState.phase === 'voting'"
        :players="room.players"
        :player-id="playerId"
        :vote-count="voteProgress.count"
        :vote-total="voteProgress.total"
        :disabled="voting"
        @vote="handleVote"
      />

      <div v-if="gameState.phase === 'reveal'" class="text-center space-y-4 animate-bounce-in">
        <div v-if="lastRoundResult?.eliminatedPlayerId" class="space-y-3">
          <div class="text-5xl">&#128128;</div>
          <h2 class="text-xl font-black text-white">{{ eliminatedPlayerName }} a été éliminé !</h2>
          <div class="inline-block px-4 py-2 rounded-xl text-sm font-bold"
            :class="lastRoundResult.eliminatedRole === 'undercover' || lastRoundResult.eliminatedRole === 'mrWhite'
              ? 'bg-red-900/30 ring-1 ring-red-500/30 text-red-300'
              : 'bg-green-900/30 ring-1 ring-green-500/30 text-green-300'">
            {{ roleLabel(lastRoundResult.eliminatedRole) }}
            <span v-if="lastRoundResult.eliminatedWord" class="ml-1 opacity-70">— {{ lastRoundResult.eliminatedWord }}</span>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div class="text-5xl">&#129335;</div>
          <h2 class="text-xl font-black text-white">Pas de majorité — personne n'est éliminé !</h2>
        </div>

        <div v-if="isHost && canContinueGame" class="flex flex-col gap-3 items-center">
          <GameButton variant="primary" size="lg" @click="handleContinueRound">
            &#10145;&#65039; Continuer
          </GameButton>
          <GameButton variant="ghost" size="sm" @click="handleNextRound">
            &#127968; Retour au lobby
          </GameButton>
        </div>
        <p v-else-if="!isHost && canContinueGame" class="text-sm text-gray-400 animate-pulse">En attente de l'hôte...</p>
        <div v-else-if="isHost" class="flex flex-col gap-3 items-center">
          <GameButton variant="primary" size="lg" @click="handleNextRound">
            &#127968; Retour au lobby
          </GameButton>
        </div>
        <p v-else class="text-sm text-gray-400 animate-pulse">En attente de l'hôte...</p>
      </div>

      <div v-if="gameState.phase === 'finished'" class="text-center py-12 animate-bounce-in">
        <div class="text-6xl mb-4">&#127942;</div>
        <h2 class="text-3xl font-black text-white mb-2">{{ winnerText }}</h2>
        <p class="text-gray-500">Redirection vers le lobby...</p>
      </div>
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
const route = useRoute();
const { room, playerId, isHost, fetchRoom, cleanup } = useRoomAPI();
const { myWord, myRole, fetchMyInfo, vote, nextTurn, startVoting, continueRound, backToLobby, returnToLobby, cleanup: gameCleanup } = useGameAPI();
const { connect, disconnect } = useSSE();

const voting = ref(false);

const gameState = computed(() => (room.value as any)?.gameState ?? null);
const animeSlug = computed(() => (room.value as any)?.anime ?? 'naruto');

const phaseLabel = computed(() => {
  const phases: Record<string, string> = {
    discussion: 'Discussion',
    voting: 'Vote',
    reveal: 'Révélation',
    finished: 'Fin',
  };
  return phases[gameState.value?.phase] || gameState.value?.phase || 'En attente';
});

const phaseBadgeClass = computed(() => {
  const base = 'inline-block px-4 py-1 rounded-full text-[0.7rem] font-extrabold uppercase tracking-wider';
  const colors: Record<string, string> = {
    discussion: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    voting: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    reveal: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    finished: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  };
  return `${base} ${colors[gameState.value?.phase] || ''}`;
});

const winnerText = computed(() => {
  if (!gameState.value?.winner) return 'Partie terminée !';
  return gameState.value.winner === 'civilians' ? 'Les civils ont gagné !' : 'Les Undercover ont gagné !';
});

const lastRoundResult = computed(() => {
  if (!gameState.value?.rounds?.length) return null;
  return gameState.value.rounds[gameState.value.rounds.length - 1];
});

const eliminatedPlayerName = computed(() => {
  if (!lastRoundResult.value?.eliminatedPlayerId || !room.value) return '';
  const p = room.value.players.find((pl: any) => pl.id === lastRoundResult.value.eliminatedPlayerId);
  return p?.name ?? 'Un joueur';
});

function roleLabel(role?: string): string {
  if (role === 'undercover') return 'Undercover';
  if (role === 'mrWhite') return 'Mr. White';
  if (role === 'civil') return 'Civil';
  return role ?? 'Inconnu';
}

const canContinueGame = computed(() => {
  if (!gameState.value?.phase || gameState.value.phase !== 'reveal') return false;
  if (aliveAll.value.length <= 2) return false;
  if (lastRoundResult.value?.eliminatedPlayerId) return false;
  return true;
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
  if (isCurrentSpeaker(player.id) && gameState.value?.phase === 'discussion') return 'ring-2 ring-green-500';
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
  await backToLobby();
}

async function handleContinueRound() {
  await continueRound();
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
