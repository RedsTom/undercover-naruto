<template>
  <div :class="['game-card', glowClass]">
    <div v-if="$slots.header" class="game-card__header">
      <slot name="header" />
    </div>
    <div :class="bodyClass">
      <slot />
    </div>
    <div v-if="$slots.footer" class="game-card__header border-t border-white/5">
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
  return `game-card--glow${props.glow === 'red' ? '-red' : props.glow === 'green' ? '-green' : ''}`;
});

const bodyClass = computed(() => {
  return props.noPadding ? '' : 'game-card__body';
});
</script>
