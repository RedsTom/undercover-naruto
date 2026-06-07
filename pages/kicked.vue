<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center space-y-6 animate-slide-up">
      <div class="text-7xl">&#128683;</div>
      <h1 class="text-3xl font-black text-white">Vous avez été exclu</h1>
      <p class="text-gray-400">L'hôte vous a exclu de la partie.</p>
      <GameButton @click="navigateTo('/')">&#8592; Retour à l'accueil</GameButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { cleanup } = useRoomAPI();
const { cleanup: gameCleanup } = useGameAPI();
const { disconnect } = useSSE();

onMounted(() => {
  gameCleanup();
  cleanup();
  disconnect();
});
</script>