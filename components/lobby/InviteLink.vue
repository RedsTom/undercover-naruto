<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">🔗 Inviter des amis</h3>
    </template>

    <div class="space-y-4">
      <div>
        <p class="game-label">Code de la salle</p>
        <div class="flex items-center gap-2">
          <div class="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-ninja-400 font-bold select-all">
            {{ room.code }}
          </div>
          <GameButton size="sm" @click="copyCode">
            {{ copied ? '✅' : '📋' }}
          </GameButton>
        </div>
      </div>

      <div>
        <p class="game-label">Lien d'invitation</p>
        <div class="flex items-center gap-2">
          <input
            :value="inviteLink"
            readonly
            class="game-input flex-1"
          />
          <GameButton size="sm" @click="copyLink">
            {{ linkCopied ? '✅' : '📋' }}
          </GameButton>
        </div>
      </div>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { RoomState } from '~/types';

const props = defineProps<{
  room: RoomState;
}>();

const copied = ref(false);
const linkCopied = ref(false);

const inviteLink = computed(() => {
  if (import.meta.client) {
    return `${window.location.origin}/room/${props.room.code}`;
  }
  return '';
});

async function copyCode() {
  await navigator.clipboard.writeText(props.room.code);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value);
  linkCopied.value = true;
  setTimeout(() => { linkCopied.value = false; }, 2000);
}
</script>
