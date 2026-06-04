<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Joueurs ({{ room.playerCount }}/{{ room.maxPlayers }})</h3>
        <UBadge v-if="room.hostId === playerId" color="primary" variant="subtle">Hôte</UBadge>
      </div>
    </template>

    <div class="space-y-2">
      <div
        v-for="player in room.players"
        :key="player.id"
        class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="flex items-center gap-3">
          <UAvatar
            :text="player.name.charAt(0).toUpperCase()"
            :ui="{ size: 'md' }"
          />
          <div>
            <p class="font-medium">{{ player.name }}</p>
            <div class="flex items-center gap-2">
              <UBadge v-if="player.isHost" color="primary" variant="subtle" size="xs">Hôte</UBadge>
              <UBadge v-if="!player.isAlive" color="red" variant="subtle" size="xs">Éliminé</UBadge>
            </div>
          </div>
        </div>

        <UButton
          v-if="isHost && player.id !== playerId"
          color="red"
          variant="ghost"
          size="xs"
          icon="i-heroicons-x-mark"
          @click="handleKick(player.id)"
        />
      </div>
    </div>
  </UCard>
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