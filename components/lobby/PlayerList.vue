<template>
  <GameCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-white">
          👥 Joueurs
          <span class="text-sm font-normal text-gray-400">({{ room.playerCount }}/{{ room.maxPlayers }})</span>
        </h3>
        <span class="game-badge game-badge--orange">👑 Hôte</span>
      </div>
    </template>

    <div class="space-y-2">
      <div
        v-for="player in room.players" :key="player.id"
        class="flex items-center justify-between p-3 rounded-xl transition-all duration-200"
        :class="player.isHost ? 'bg-ninja-500/10 ring-1 ring-ninja-500/20' : 'bg-white/5 hover:bg-white/10'"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            :class="player.isHost ? 'bg-gradient-to-br from-ninja-400 to-ninja-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'">
            {{ player.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="font-bold text-white">{{ player.name }}</p>
            <div class="flex items-center gap-2 text-xs">
              <span v-if="player.isHost" class="text-ninja-400">👑 Hôte</span>
              <span v-if="!player.isAlive" class="text-akatsuki-400">💀 Éliminé</span>
            </div>
          </div>
        </div>

        <button
          v-if="isHost && player.id !== playerId"
          class="game-btn game-btn--ghost game-btn--sm"
          @click="handleKick(player.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { RoomState } from '~/types';

const props = defineProps<{
  room: RoomState;
  playerId: string | null;
  isHost: boolean;
}>();

const emit = defineEmits<{
  kick: [targetId: string];
}>();

function handleKick(targetId: string) {
  emit('kick', targetId);
}
</script>
