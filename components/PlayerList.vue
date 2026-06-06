<template>
  <GameCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-white">
          &#128101; Joueurs
          <span class="text-sm font-normal text-gray-400">({{ room.playerCount }}/{{ room.maxPlayers }})</span>
        </h3>
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400">&#128081; Hôte</span>
      </div>
    </template>

    <div class="space-y-2">
      <div
        v-for="player in room.players" :key="player.id"
        class="flex items-center justify-between p-3 rounded-xl transition-all duration-200"
        :class="player.isHost ? 'bg-orange-500/10 ring-1 ring-orange-500/20' : 'bg-white/5 hover:bg-white/10'"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            :class="player.isHost ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'">
            {{ player.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="font-bold text-white">{{ player.name }}</p>
            <div class="flex items-center gap-2 text-xs">
              <span v-if="player.isHost" class="text-orange-400">&#128081; Hôte</span>
              <span v-if="!player.isAlive" class="text-red-400">&#128128; Éliminé</span>
            </div>
          </div>
        </div>

        <GameButton
          v-if="isHost && player.id !== playerId"
          variant="ghost"
          size="sm"
          @click="handleKick(player.id)"
        >
          &#10005;
        </GameButton>
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
