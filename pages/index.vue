<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-md mx-auto space-y-8">
        <div class="text-center space-y-4">
          <h1 class="text-5xl font-bold text-orange-600 dark:text-orange-400">Undercover</h1>
          <p class="text-xl text-gray-600 dark:text-gray-300">Naruto Edition</p>
        </div>

        <UCard>
          <div class="space-y-6">
            <UFormField label="Votre pseudo">
              <UInput v-model="playerName" placeholder="Entrez votre pseudo" size="lg" icon="i-heroicons-user" />
            </UFormField>

            <div class="space-y-3">
              <UButton block size="lg" :disabled="!canCreate" :loading="creating" @click="handleCreate">
                Créer une partie
              </UButton>

              <div class="flex items-center gap-4 my-4">
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span class="text-sm text-gray-500">ou</span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              <UFormField label="Code de la salle">
                <UInput v-model="roomCode" placeholder="ABC123" size="lg" class="text-center text-2xl font-mono tracking-widest" :maxlength="6" @keyup.enter="handleJoin" />
              </UFormField>

              <UButton block size="lg" color="gray" :disabled="!canJoin" :loading="joining" @click="handleJoin">
                Rejoindre
              </UButton>
            </div>
          </div>
        </UCard>

        <UCard v-if="error">
          <UAlert color="red" :description="error" />
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { createRoom, joinRoom, setRoom } = useRoomAPI();

const roomCode = ref('');
const creating = ref(false);
const joining = ref(false);
const error = ref('');
const playerName = ref('');

const canCreate = computed(() => playerName.value.trim().length >= 2 && !creating.value);
const canJoin = computed(() => playerName.value.trim().length >= 2 && roomCode.value.length === 6 && !joining.value);

async function handleCreate() {
  if (!canCreate.value) return;
  creating.value = true;
  error.value = '';
  try {
    const result = await createRoom(playerName.value.trim());
    if (result.success && result.roomCode) {
      navigateTo(`/room/${result.roomCode}`);
    } else {
      error.value = result.error || 'Erreur lors de la création';
    }
  } catch { error.value = 'Erreur de connexion'; }
  finally { creating.value = false; }
}

async function handleJoin() {
  if (!canJoin.value) return;
  joining.value = true;
  error.value = '';
  try {
    const result = await joinRoom(roomCode.value.toUpperCase(), playerName.value.trim());
    if (result.success && result.roomCode) {
      navigateTo(`/room/${result.roomCode}`);
    } else {
      error.value = result.error || 'Salle introuvable';
    }
  } catch { error.value = 'Erreur de connexion'; }
  finally { joining.value = false; }
}
</script>