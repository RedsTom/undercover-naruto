<template>
  <button
    :class="[base, sizes[size], variants[variant], block ? 'w-full' : '']"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  block?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}>(), {
  variant: 'primary',
  block: false,
  size: 'md',
  disabled: false,
  loading: false,
});

const base = 'inline-flex items-center justify-center gap-2 font-extrabold uppercase tracking-wide cursor-pointer select-none border-none outline-none transition-all duration-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed';

const sizes: Record<string, string> = {
  sm: 'px-4 py-2 text-xs rounded-lg',
  md: 'px-6 py-3.5 text-sm rounded-xl',
  lg: 'px-8 py-[1.125rem] text-base rounded-xl',
};

const variants: Record<string, string> = {
  primary: [
    'bg-gradient-to-b from-orange-400 to-orange-500 text-white',
    'shadow-[0_5px_0_#c2410c,0_8px_16px_rgba(0,0,0,0.35)]',
    'hover:-translate-y-0.5 hover:shadow-[0_6px_0_#b33d0a,0_10px_20px_rgba(0,0,0,0.4)] hover:from-orange-500 hover:to-orange-600',
    'active:translate-y-1 active:shadow-[0_1px_0_#c2410c,0_2px_4px_rgba(0,0,0,0.2)] active:from-orange-600 active:to-orange-700',
    'disabled:hover:translate-y-0 disabled:hover:shadow-[0_5px_0_#c2410c,0_8px_16px_rgba(0,0,0,0.35)]',
  ].join(' '),
  secondary: [
    'bg-transparent text-orange-400',
    'shadow-[inset_0_0_0_2px_rgba(249,115,22,0.5),0_4px_0_rgba(194,65,12,0.4)]',
    'hover:-translate-y-0.5 hover:bg-orange-500/10 hover:shadow-[inset_0_0_0_2px_rgba(249,115,22,0.7),0_5px_0_rgba(194,65,12,0.5)]',
    'active:translate-y-1 active:shadow-[inset_0_0_0_2px_rgba(249,115,22,0.7),0_1px_0_rgba(194,65,12,0.4)]',
    'disabled:hover:translate-y-0',
  ].join(' '),
  danger: [
    'bg-gradient-to-b from-red-400 to-red-500 text-white',
    'shadow-[0_5px_0_#b91c1c,0_8px_16px_rgba(0,0,0,0.35)]',
    'hover:-translate-y-0.5 hover:shadow-[0_6px_0_#a51b1b,0_10px_20px_rgba(0,0,0,0.4)] hover:from-red-500 hover:to-red-600',
    'active:translate-y-1 active:shadow-[0_1px_0_#b91c1c,0_2px_4px_rgba(0,0,0,0.2)] active:from-red-600 active:to-red-700',
    'disabled:hover:translate-y-0',
  ].join(' '),
  ghost: [
    'bg-transparent text-gray-400 shadow-none',
    'hover:-translate-y-0.5 hover:bg-white/5 hover:text-white',
    'active:translate-y-0.5 active:bg-white/10',
    'disabled:hover:translate-y-0',
  ].join(' '),
};
</script>
