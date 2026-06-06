<template>
  <GameCard :glow="selectedPlayer ? 'red' : null">
    <template #header>
      <h3 class="text-lg font-bold text-white">&#128499;&#65039; Votez pour éliminer</h3>
    </template>

    <div class="space-y-4">
      <div class="text-center text-sm text-gray-400 font-bold">
        Votes : <span class="text-orange-400">{{ voteCount }}</span>/{{ voteTotal }}
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="player in alivePlayers" :key="player.id"
          :disabled="disabled"
          class="p-3 rounded-xl text-sm font-bold transition-all duration-200"
          :class="selectedPlayer === player.id
            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500 scale-[0.97]'
            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10'"
          @click="selectPlayer(player.id)"
        >
          <div class="flex items-center justify-between">
            <span>{{ player.name }}</span>
            <span v-if="player.isHost" class="text-xs">&#128081;</span>
          </div>
        </button>

        <button
          :disabled="disabled"
          class="p-3 rounded-xl text-sm font-bold transition-all duration-200"
          :class="selectedPlayer === 'neutral'
            ? 'bg-gray-500/20 text-gray-300 ring-2 ring-gray-500 scale-[0.97]'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white ring-1 ring-white/10'"
          @click="selectPlayer('neutral')"
        >
          &#129335; Neutre
        </button>
      </div>

      <GameButton
        v-if="selectedPlayer"
        variant="danger"
        block
        :disabled="disabled"
        class="animate-bounce-in"
        @click="confirmVote"
      >
        {{ disabled ? '&#9203;...' : '&#9889; Confirmer le vote' }}
      </GameButton>
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

const alivePlayers = computed(() => props.players.filter(p => p.isAlive && p.id !== props.playerId));

function selectPlayer(id: string) {
  if (props.disabled) return;
  selectedPlayer.value = id;
}

async function confirmVote() {
  if (!selectedPlayer.value || props.disabled) return;
  emit('vote', selectedPlayer.value);
}
</script>
