<template>
  <div class="min-h-screen pb-16">
    <div v-if="room" class="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-slide-up">
      <div v-if="!playerId" class="text-center space-y-4">
        <GameCard>
          <form @submit.prevent="handleJoinRoom" class="text-center space-y-4">
            <div class="text-5xl">&#127841;</div>
            <h3 class="text-xl font-bold text-white">Rejoindre la partie</h3>
            <p class="text-sm text-gray-400">
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
            <span v-if="animeName" class="text-sm">Animé :</span> <span v-if="animeName" class="font-bold text-orange-400">{{ animeName }}</span>
            <span v-if="animeName" class="mx-2 text-gray-600">|</span>
            Code : <span class="font-mono text-2xl font-bold text-white">{{ room.code }}</span>
          </p>
        </div>

        <PlayerList :room="room" :player-id="playerId" :is-host="isHost" @kick="handleKick" />

        <div v-if="scores" class="animate-slide-up">
          <GameCard>
            <div class="space-y-4 text-center">
              <p class="block text-xs font-bold uppercase tracking-wider text-white/50">Score</p>
              <div class="flex justify-center gap-12">
                <div class="text-center">
                  <p class="text-4xl font-black text-orange-400">{{ scores.civilians }}</p>
                  <p class="text-sm text-gray-400">Civils</p>
                </div>
                <div class="text-center">
                  <p class="text-4xl font-black text-red-400">{{ scores.undercover }}</p>
                  <p class="text-sm text-gray-400">Undercover</p>
                </div>
              </div>
              <p v-if="winnerText" class="text-lg font-black text-white">{{ winnerText }}</p>
              <p v-if="roundText" class="text-sm text-gray-500">{{ roundText }}</p>
            </div>
          </GameCard>
        </div>

        <InviteLink :room="room" />

        <div class="space-y-6">
          <GameGeneralSettings :is-host="isHost" :config="settingsConfig" @config-changed="onGeneralConfigChanged" />
          <GameAnimeSettings :is-host="isHost" :config="settingsConfig" @config-changed="onAnimeConfigChanged" />

          <div v-if="isHost" class="flex flex-col gap-2 pt-2">
            <GameButton block size="lg" :disabled="!canStartGame" @click="handleStart">
              <template v-if="isInGame">&#10145;&#65039; Tour suivant</template>
              <template v-else-if="canStartGame">&#128640; Lancer la partie</template>
              <template v-else>&#9203; {{ playerCount }}/{{ minPlayers }}</template>
            </GameButton>
          </div>
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
const { room, playerId, isHost, playerCount, cleanup, joinRoom, kickPlayer } = useRoomAPI();
const { startGame, fetchMyInfo } = useGameAPI();
const { connect, disconnect, on, off } = useSSE();

const joinName = ref('');
const joining = ref(false);
const joinError = ref('');

const gameState = computed(() => (room.value as any)?.gameState ?? null);
const isInGame = computed(() => gameState.value && gameState.value.currentRound > 0 && gameState.value.phase === 'waiting');

const currentAnimeSlug = ref('');
const animeName = ref('');

const lastConfig = computed(() => (room.value as any)?.gameState?.config ?? (room.value as any)?.lastConfig ?? null);

const minPlayers = computed(() => lastConfig.value?.minPlayers ?? 3);

const settingsConfig = computed(() => isHost.value
  ? (lastConfig.value ?? undefined)
  : ((room.value as any)?.pendingConfig ?? lastConfig.value ?? undefined)
);

const gameConfig = ref<Partial<GameConfig>>({});

const canStartGame = computed(() => {
  if (!isHost.value) return false;
  if (isInGame.value) return true;
  if (!currentAnimeSlug.value) return false;
  if (playerCount.value < minPlayers.value) return false;
  return true;
});

const scores = computed(() => {
  if (gameState.value) return gameState.value.scores;
  const last = (room.value as any)?.lastGameResult;
  if (last) return last.scores;
  return null;
});

const winnerText = computed(() => {
  if (gameState.value?.winner) {
    return gameState.value.winner === 'civilians' ? '🏆 Les civils ont gagné !' : '🕵️ Les Undercover ont gagné !';
  }
  const last = (room.value as any)?.lastGameResult;
  if (last?.winner) {
    return last.winner === 'civilians' ? '🏆 Les civils ont gagné !' : '🕵️ Les Undercover ont gagné !';
  }
  return '';
});

const roundText = computed(() => {
  if (!gameState.value?.currentRound) return '';
  return `Round ${gameState.value.currentRound}`;
});

onMounted(async () => {
  const code = route.params.code as string;
  try {
    const data = await $fetch(`/api/rooms/code/${code}`);
    room.value = data as any;
    const initialSlug = (data as any)?.pendingConfig?.anime || (data as any)?.lastConfig?.anime || '';
    if (initialSlug) currentAnimeSlug.value = initialSlug;
  } catch {
    navigateTo('/');
    return;
  }
  if (room.value && playerId.value) {
    connect(room.value.id);
  }

  on('room:updated', (data: any) => {
    room.value = data;
  });

  on('game:started', (data: any) => {
    room.value = data;
    fetchMyInfo();
  });

  on('player:kicked', (data: any) => {
    if (data?.playerId === playerId.value) {
      cleanup();
      disconnect();
      navigateTo('/');
    }
  });

  on('connected', (data: any) => {
    room.value = data;
  });
});

onUnmounted(() => {
  disconnect();
});

watch(() => room.value?.gameState?.phase, (phase) => {
  if (phase && phase !== 'waiting' && phase !== 'finished' && playerId.value) {
    fetchMyInfo();
    navigateTo(`/game/${route.params.code}`);
  }
});

watch(currentAnimeSlug, async (slug) => {
  if (!slug) { animeName.value = ''; return; }
  try {
    const manifest = await $fetch(`/api/anime/${slug}`) as any;
    animeName.value = manifest.name;
  } catch {
    animeName.value = slug;
  }
}, { immediate: false });

let configDebounce: ReturnType<typeof setTimeout> | null = null;

function pushConfig() {
  if (!room.value || !playerId.value) return;
  $fetch('/api/rooms/config', {
    method: 'POST',
    body: { roomId: room.value.id, playerId: playerId.value, config: gameConfig.value },
  }).catch(() => {});
}

function onGeneralConfigChanged(config: Partial<GameConfig>) {
  gameConfig.value = { ...gameConfig.value, ...config };
  if (isHost.value) {
    if (configDebounce) clearTimeout(configDebounce);
    configDebounce = setTimeout(pushConfig, 500);
  }
}

function onAnimeConfigChanged(config: Partial<GameConfig>) {
  if (config.anime) currentAnimeSlug.value = config.anime;
  gameConfig.value = { ...gameConfig.value, ...config };
  if (isHost.value) {
    if (configDebounce) clearTimeout(configDebounce);
    configDebounce = setTimeout(pushConfig, 500);
  }
}

async function handleJoinRoom() {
  if (joinName.value.trim().length < 2) return;
  joining.value = true;
  joinError.value = '';
  try {
    const result = await joinRoom(route.params.code as string, joinName.value.trim());
    if (result.success) {
      connect(room.value!.id);
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
  await kickPlayer(targetId);
}

async function handleStart() {
  const result = await startGame(gameConfig.value);
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
