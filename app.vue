<template>
  <div class="game-bg-grid game-bg-radial min-h-screen">
    <NuxtPage />
    <div aria-hidden="true" class="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      <span class="absolute text-4xl animate-float" style="left: 10%; animation-delay: 0s; opacity: 0.12;">🍃</span>
      <span class="absolute text-3xl animate-float" style="left: 30%; animation-delay: 1s; opacity: 0.08;">🍂</span>
      <span class="absolute text-4xl animate-float" style="left: 50%; animation-delay: 2s; opacity: 0.1;">🌀</span>
      <span class="absolute text-3xl animate-float" style="left: 70%; animation-delay: 0.5s; opacity: 0.08;">🍃</span>
      <span class="absolute text-3xl animate-float" style="left: 90%; animation-delay: 1.5s; opacity: 0.06;">⭐</span>
    </div>
  </div>
</template>
