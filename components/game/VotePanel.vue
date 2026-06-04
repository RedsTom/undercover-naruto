<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Votez pour l'intrus</h3>
    </template>

    <div class="space-y-2">
      <UButton
        v-for="player in alivePlayers"
        :key="player.id"
        block
        :color="selectedPlayer === player.id ? 'red' : 'gray'"
        :variant="selectedPlayer === player.id ? 'solid' : 'outline'"
        @click="selectPlayer(player.id)"
        :disabled="player.id === playerId"
      >
        <div class="flex items-center justify-between w-full">
          <span>{{ player.name }}</span>
          <UBadge v-if="player.isHost" color="primary" variant="subtle" size="xs">Hôte</UBadge>
        </div>
      </UButton>
    </div>

    <UButton
      v-if="selectedPlayer"
      block
      color="red"
      size="lg"
      class="mt-4"
      :loading="voting"
      @click="confirmVote"
    >
      Confirmer le vote
    </UButton>
  </UCard>
</template>

<script setup lang="ts">
import type { Player } from '~/types';

const props = defineProps<{
  players: Player[];
  playerId: string | null;
}>();

const emit = defineEmits<{
  vote: [targetId: string];
}>();

const selectedPlayer = ref<string | null>(null);
const voting = ref(false);

const alivePlayers = computed(() => {
  return props.players.filter(p => p.isAlive);
});

function selectPlayer(id: string) {
  selectedPlayer.value = id;
}

async function confirmVote() {
  if (!selectedPlayer.value) return;
  voting.value = true;
  emit('vote', selectedPlayer.value);
}
</script>
