<template>
  <button
    :class="[
      'game-btn',
      `game-btn--${variant}`,
      block ? 'game-btn--block' : '',
      size === 'lg' ? 'game-btn--lg' : size === 'sm' ? 'game-btn--sm' : '',
      className,
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}>(), {
  variant: 'primary',
  block: false,
  size: 'md',
  disabled: false,
  loading: false,
  className: '',
});
</script>
