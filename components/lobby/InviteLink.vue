<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Inviter des amis</h3>
    </template>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Code de la salle</label>
        <div class="flex items-center gap-2">
          <UInput
            :model-value="room.code"
            readonly
            class="flex-1 text-center text-2xl font-mono tracking-widest"
          />
          <UButton
            icon="i-heroicons-clipboard-document"
            @click="copyCode"
            :color="copied ? 'green' : 'primary'"
          >
            {{ copied ? 'Copié!' : 'Copier' }}
          </UButton>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Lien d'invitation</label>
        <div class="flex items-center gap-2">
          <UInput
            :model-value="inviteLink"
            readonly
            class="flex-1"
          />
          <UButton
            icon="i-heroicons-clipboard-document"
            @click="copyLink"
            :color="linkCopied ? 'green' : 'primary'"
          >
            {{ linkCopied ? 'Copié!' : 'Copier' }}
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
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
