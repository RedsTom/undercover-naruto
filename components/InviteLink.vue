<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">&#128279; Inviter des amis</h3>
    </template>

    <div class="space-y-5">
      <div class="flex flex-col gap-2">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">Code de la salle</p>
        <div class="flex items-center gap-3">
          <div class="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-orange-400 font-bold select-all">
            {{ room.code }}
          </div>
          <GameButton size="sm" @click="copyCode">
            {{ copied ? '&#9989;' : '&#128203;' }}
          </GameButton>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">Lien d'invitation</p>
        <div class="flex items-center gap-3">
          <input
            :value="inviteLink"
            readonly
            class="flex-1 w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none box-border"
          />
          <GameButton size="sm" @click="copyLink">
            {{ linkCopied ? '&#9989;' : '&#128203;' }}
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
