<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full space-y-8 animate-slide-up">
      <div class="text-center space-y-3">
        <div class="text-7xl mb-4 animate-float">&#127841;</div>
        <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
          UNDERCOVER
        </h1>
        <p class="text-xl text-orange-300 font-semibold tracking-wider">ANIME EDITION</p>
        <p class="text-sm text-gray-500">Trouvez l'intrus avant qu'il ne soit trop tard</p>
      </div>

      <GameCard>
        <div class="space-y-5">
          <form @submit.prevent="handleCreate" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-white/50">Pseudo</label>
              <input v-model="createName" placeholder="Entrez votre pseudo" autocomplete="off" class="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border placeholder:text-white/25 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" />
            </div>

            <ClientOnly>
              <GameButton type="submit" block size="lg" :disabled="createName.trim().length < 2 || creating" :loading="creating">
                &#128640; Créer une partie
              </GameButton>
              <template #fallback>
                <GameButton type="submit" block size="lg" disabled>
                  &#128640; Créer une partie
                </GameButton>
              </template>
            </ClientOnly>
          </form>

          <div class="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          <form @submit.prevent="handleJoin" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-white/50">Code de la salle</label>
              <input
                v-model="roomCode"
                placeholder="ABC123"
                autocomplete="off"
                class="w-full px-4 py-3.5 rounded-xl text-center text-2xl font-mono tracking-widest text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border placeholder:text-white/25 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                :maxlength="6"
              />
            </div>

            <ClientOnly>
              <GameButton type="submit" block size="lg" variant="secondary" :disabled="roomCode.length !== 6 || joining" :loading="joining">
                &#128279; Rejoindre
              </GameButton>
              <template #fallback>
                <GameButton type="submit" block size="lg" variant="secondary" disabled>
                  &#128279; Rejoindre
                </GameButton>
              </template>
            </ClientOnly>
          </form>
        </div>
      </GameCard>

      <div v-if="error" class="animate-shake">
        <div class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32_rgba(0,0,0,0.3)] overflow-hidden">
          <div class="p-6">
            <div class="flex items-center gap-3 text-red-400">
              <span>&#9888;&#65039;</span>
              <span class="text-sm font-semibold">{{ error }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <NuxtLink to="/legal" class="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          Mentions légales
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { createRoom, joinRoom } = useRoomAPI();

const route = useRoute();

if (import.meta.client && window.self !== window.top && route.query.frame_id) {
  navigateTo({ path: '/discord', query: route.query });
}

const roomCode = ref('');
const createName = ref('');
const creating = ref(false);
const joining = ref(false);
const error = ref('');

async function handleCreate() {
  if (createName.value.trim().length < 2) return;
  creating.value = true;
  error.value = '';
  try {
    const result = await createRoom(createName.value.trim());
    if (result.success && result.roomCode) {
      navigateTo(`/room/${result.roomCode}`);
    } else {
      error.value = result.error || 'Erreur lors de la création';
    }
  } catch { error.value = 'Erreur de connexion'; }
  finally { creating.value = false; }
}

async function handleJoin() {
  if (roomCode.value.length !== 6) return;
  joining.value = true;
  error.value = '';
  try {
    await $fetch(`/api/rooms/code/${roomCode.value.toUpperCase()}`);
    navigateTo(`/room/${roomCode.value.toUpperCase()}`);
  } catch { error.value = 'Salle introuvable'; }
  finally { joining.value = false; }
}
</script>