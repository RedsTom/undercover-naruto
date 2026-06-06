<template>
  <GameCard :glow="selectedPlayer ? 'red' : null">
    <template #header>
      <h3 class="text-lg font-bold text-white">🗳️ Votez pour éliminer</h3>
    </template>

    <div class="space-y-3">
      <div class="text-center text-sm text-gray-400 font-bold mb-1">
        Votes : <span class="text-ninja-400">{{ voteCount }}</span>/{{ voteTotal }}
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="player in alivePlayers" :key="player.id"
          :disabled="player.id === playerId || disabled"
          class="p-3 rounded-xl text-sm font-bold transition-all duration-200"
          :class="selectedPlayer === player.id
            ? 'bg-akatsuki-500/20 text-akatsuki-400 ring-2 ring-akatsuki-500 scale-[0.97]'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10'"
          @click="selectPlayer(player.id)"
        >
          <div class="flex items-center justify-between">
            <span>{{ player.name }}</span>
            <span v-if="player.isHost" class="text-xs">👑</span>
          </div>
        </button>
      </div>

      <div class="text-center pt-1">
        <button
          :disabled="disabled"
          class="px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white ring-1 ring-white/10"
          @click="voteNeutral"
        >
          🤷 Neutre
        </button>
      </div>

      <button
        v-if="selectedPlayer"
        :disabled="disabled"
        class="w-full mt-2 py-3 rounded-xl font-bold text-white transition-all duration-200 animate-bounce-in game-btn--danger"
        @click="confirmVote"
      >
        {{ disabled ? '⏳...' : '⚡ Confirmer le vote' }}
      </button>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { Player } from '~/types';

const props = withDefaults(defineProps<{
  players: Player[];
  playerId: string | null;
  voteCount?: number;
  voteTotal?: number;
  disabled?: boolean;
}>(), {
  playerId: null,
  voteCount: 0,
  voteTotal: 0,
  disabled: false,
});

const emit = defineEmits<{ vote: [targetId: string] }>();

const selectedPlayer = ref<string | null>(null);

const alivePlayers = computed(() => props.players.filter(p => p.isAlive));

function selectPlayer(id: string) {
  if (props.disabled) return;
  selectedPlayer.value = id;
}

function voteNeutral() {
  if (props.disabled) return;
  emit('vote', 'neutral');
}

async function confirmVote() {
  if (!selectedPlayer.value || props.disabled) return;
  emit('vote', selectedPlayer.value);
}
</script>
