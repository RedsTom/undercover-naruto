<template>
  <div :class="['bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200 overflow-hidden', glowClass]">
    <div v-if="$slots.header" class="px-6 py-5 border-b border-white/5">
      <slot name="header" />
    </div>
    <div :class="noPadding ? '' : 'p-6'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-5 border-t border-white/5">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  glow?: 'orange' | 'red' | 'green' | null;
  noPadding?: boolean;
}>(), {
  glow: null,
  noPadding: false,
});

const glowClass = computed(() => {
  if (!props.glow) return '';
  if (props.glow === 'red') return 'ring-2 ring-red-500/30 shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(239,68,68,0.15)]';
  if (props.glow === 'green') return 'ring-2 ring-green-500/30 shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(16,185,129,0.15)]';
  return 'ring-2 ring-orange-500/30 animate-pulse-glow';
});
</script>
