<template>
  <div class="min-h-screen pb-16">
    <template v-if="room && gameState">
      <div class="hidden max-[420px]:block text-center px-2 py-3 space-y-2">
        <div class="space-x-1">
          <span :class="compactBadgeClass">{{ phaseLabel }}</span>
          <span class="text-[0.5rem] text-gray-500">R{{ gameState.currentRound }}</span>
        </div>

        <div v-if="gameState.phase === 'discussion'">
          <div v-if="currentSpeaker" class="space-y-1">
            <div class="w-7 h-7 rounded-full mx-auto overflow-hidden ring-2 ring-green-500">
              <img v-if="(currentSpeaker as any).discordAvatar" :src="(currentSpeaker as any).discordAvatar" :alt="currentSpeaker.name" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[0.6rem] font-bold text-white bg-gradient-to-br from-green-400 to-green-600">
                {{ currentSpeaker.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            <p class="text-[0.6rem] font-bold text-green-400 truncate">{{ currentSpeaker.name }} parle</p>
          </div>
          <div v-if="myWord">
            <p class="text-sm font-black text-white">{{ myWord }}</p>
            <p v-if="myRole && !gameState.value?.config?.hideRole" class="text-[0.5rem] text-white/50">{{ roleLabel(myRole) }}</p>
          </div>
        </div>

        <div v-else-if="gameState.phase === 'voting'">
          <div class="text-lg">&#128499;&#65039;</div>
          <p class="text-[0.65rem] font-bold text-white">Vote en cours...</p>
          <p class="text-[0.55rem] text-gray-400">{{ voteProgress.count }}/{{ voteProgress.total }}</p>
        </div>

        <div v-else-if="gameState.phase === 'reveal'">
          <div class="text-lg">&#128128;</div>
          <p class="text-[0.65rem] font-bold text-white truncate">{{ eliminatedPlayerName || 'Pas d\'élimination' }}</p>
          <p v-if="lastRoundResult?.eliminatedRole" class="text-[0.5rem]"
            :class="lastRoundResult.eliminatedRole === 'undercover' || lastRoundResult.eliminatedRole === 'mrWhite' ? 'text-red-300' : 'text-green-300'">
            {{ roleLabel(lastRoundResult.eliminatedRole) }}
          </p>
        </div>

        <div v-else>
          <div v-if="myWord">
            <p class="text-sm font-black text-white">{{ myWord }}</p>
          </div>
        </div>

        <div class="text-[0.5rem] text-white/50">
          &#128101; {{ aliveAll.length }} en vie
        </div>
      </div>
      <div class="block max-[420px]:hidden max-w-4xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
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
            <GameButton v-if="!isIframe" variant="ghost" size="sm" @click="handleLeave">
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
            <div class="mb-1">
              <template v-if="isCurrentSpeaker(player.id) && gameState.phase === 'discussion'">
                <div class="w-10 h-10 rounded-full mx-auto overflow-hidden ring-2 ring-green-500">
                  <img v-if="(player as any).discordAvatar" :src="(player as any).discordAvatar" :alt="player.name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-green-400 to-green-600">
                    {{ player.name.charAt(0).toUpperCase() }}
                  </div>
                </div>
              </template>
              <div v-else class="text-2xl">
                {{ player.isAlive ? '&#128564;' : '&#128128;' }}
              </div>
            </div>
            <p class="font-bold text-white text-sm">{{ player.name }}</p>
            <p v-if="player.id === playerId" class="text-xs text-orange-400 mt-0.5">&#128100; Vous</p>
            <p v-if="isCurrentSpeaker(player.id) && gameState.phase === 'discussion'" class="text-xs text-green-400 font-bold mt-0.5 animate-pulse">&#128266; Parle</p>
          </div>
        </div>

        <div v-if="gameState.phase === 'discussion'" class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          <div class="p-6 text-center space-y-4">
            <div v-if="currentSpeaker" class="space-y-2">
              <div class="w-16 h-16 rounded-full mx-auto overflow-hidden ring-2 ring-green-500">
                <img v-if="(currentSpeaker as any).discordAvatar" :src="(currentSpeaker as any).discordAvatar" :alt="currentSpeaker.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-green-400 to-green-600">
                  {{ currentSpeaker.name.charAt(0).toUpperCase() }}
                </div>
              </div>
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

          <div v-if="!canContinueGame && gameState.exposed" class="space-y-2 border-t border-white/10 pt-6">
            <p class="text-xs font-bold uppercase tracking-wider text-white/50 text-center">Tous les rôles</p>
            <div v-for="p in gameState.exposed" :key="p.playerId"
              class="p-3 rounded-xl text-sm font-bold flex items-center gap-3"
              :class="p.role === 'undercover' || p.role === 'mrWhite'
                ? 'bg-red-900/30 ring-1 ring-red-500/30 text-red-300'
                : 'bg-green-900/30 ring-1 ring-green-500/30 text-green-300'">
              <img v-if="p.word && getWordImage(p.word)" :src="getWordImage(p.word)" :alt="p.word" class="h-10 w-auto max-w-16 rounded-lg ring-1 ring-white/10 shrink-0 object-contain" />
              <div>
                <p>{{ p.name }} — {{ p.role === 'undercover' ? 'Undercover' : p.role === 'mrWhite' ? 'Mr. White' : 'Civil' }}</p>
                <p v-if="p.word" class="text-xs opacity-70">Mot : {{ p.word }}</p>
              </div>
            </div>
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
      </div>
    </template>
    <div v-else class="text-center py-20">
      <p class="text-gray-500">Chargement...</p>
      <div class="mt-4">
        <GameButton variant="secondary" @click="navigateTo('/')">&#8592; Retour</GameButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWordInfo } from '~/utils/wordInfo';

const route = useRoute();
const { room, playerId, isHost, cleanup } = useRoomAPI();
const { myWord, myRole, fetchMyInfo, vote, nextTurn, startVoting, continueRound, backToLobby, returnToLobby, cleanup: gameCleanup } = useGameAPI();
const { connect, disconnect, on, off } = useSSE();

const isIframe = import.meta.client && window.self !== window.top;
const voting = ref(false);

function getWordImage(word: string): string | undefined {
  const entry = getWordInfo(animeSlug.value, word);
  return entry?.image;
}

const gameState = computed(() => (room.value as any)?.gameState ?? null);
const animeSlug = computed(() => (room.value as any)?.gameState?.config?.anime || (room.value as any)?.anime || '');

const phaseLabel = computed(() => {
  const phases: Record<string, string> = {
    discussion: 'Discussion',
    voting: 'Vote',
    reveal: 'Révélation',
  };
  return phases[gameState.value?.phase] || gameState.value?.phase || 'En attente';
});

const phaseBadgeClass = computed(() => {
  const base = 'inline-block px-4 py-1 rounded-full text-[0.7rem] font-extrabold uppercase tracking-wider';
  const colors: Record<string, string> = {
    discussion: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    voting: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    reveal: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  };
  return `${base} ${colors[gameState.value?.phase] || ''}`;
});

const compactBadgeClass = computed(() => {
  const base = 'inline-block px-1.5 py-0.5 rounded-full text-[0.5rem] font-extrabold uppercase tracking-wider';
  const colors: Record<string, string> = {
    discussion: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
    voting: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    reveal: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  };
  return `${base} ${colors[gameState.value?.phase] || ''}`;
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
  if (!lastRoundResult.value?.eliminatedPlayerId) return false;
  if (lastRoundResult.value?.eliminatedRole !== 'civil') return false;
  if (aliveAll.value.length <= 2) return false;
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
    count: lastRound.voteCount ?? 0,
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
    connect(room.value.id, playerId.value ?? undefined);
    await fetchMyInfo();
  }

  on('room:updated', (data: any) => {
    room.value = data;
  });

  on('game:started', (data: any) => {
    room.value = data;
    fetchMyInfo();
  });

  on('game:playerVoted', (data: any) => {
    room.value = data;
  });

  on('game:roundEnded', (data: any) => {
    room.value = data;
    fetchMyInfo();
  });

  on('game:continued', (data: any) => {
    room.value = data;
    fetchMyInfo();
  });

  on('phase:changed', (data: any) => {
    room.value = data;
  });

  on('turn:changed', (data: any) => {
    room.value = data;
  });

  on('game:reset', (data: any) => {
    room.value = data;
  });

  on('player:kicked', (data: any) => {
    if (data?.playerId === playerId.value) {
      gameCleanup();
      cleanup();
      disconnect();
      navigateTo('/kicked');
    }
  });

  on('host:changed', (data: any) => {
    if (room.value) {
      room.value = { ...room.value, hostId: data.newHostId };
    }
  });

  on('room:closed', () => {
    gameCleanup();
    cleanup();
    disconnect();
    navigateTo('/');
  });

});

watch(gameState, (newState, oldState) => {
  if (oldState && !newState) {
    gameCleanup();
    disconnect();
    navigateTo(`/room/${route.params.code}`);
  }
});

onUnmounted(() => {
  disconnect();
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
  await returnToLobby();
  navigateTo(`/room/${route.params.code}`);
}

async function handleContinueRound() {
  await continueRound();
  await fetchMyInfo();
}

async function handleReturnToLobby() {
  await returnToLobby();
  navigateTo(`/room/${route.params.code}`);
}

function handleLeave() {
  disconnect();
  cleanup();
  navigateTo('/');
}
</script>
