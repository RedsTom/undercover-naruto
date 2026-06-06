<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full space-y-8 animate-slide-up">
      <div class="text-center space-y-3">
        <div class="text-7xl mb-4 animate-float">🍥</div>
        <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ninja-400 via-ninja-500 to-akatsuki-500">
          UNDERCOVER
        </h1>
        <p class="text-xl text-ninja-300 font-semibold tracking-wider">NARUTO EDITION</p>
        <p class="text-sm text-gray-500">Trouvez l'intrus avant qu'il ne soit trop tard</p>
      </div>

      <GameCard>
        <div class="space-y-5">
          <div>
            <label class="game-label">Pseudo</label>
            <input v-model="playerName" placeholder="Entrez votre pseudo" class="game-input" />
          </div>

          <div class="space-y-3">
            <GameButton block size="lg" :disabled="!canCreate" :loading="creating" @click="handleCreate">
              🚀 Créer une partie
            </GameButton>

            <hr class="game-separator" />

            <div>
              <label class="game-label">Code de la salle</label>
              <input
                v-model="roomCode"
                placeholder="ABC123"
                class="game-input text-center text-2xl font-mono tracking-widest"
                :maxlength="6"
                @keyup.enter="handleJoin"
              />
            </div>

            <GameButton block size="lg" variant="secondary" :disabled="!canJoin" :loading="joining" @click="handleJoin">
              🔗 Rejoindre
            </GameButton>
          </div>
        </div>
      </GameCard>

      <div v-if="error" class="animate-shake">
        <div class="game-card">
          <div class="game-card__body">
            <div class="flex items-center gap-3 text-akatsuki-400">
              <span>⚠️</span>
              <span class="text-sm font-semibold">{{ error }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { createRoom, joinRoom } = useRoomAPI();

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
