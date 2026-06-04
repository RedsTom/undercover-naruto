<template>
  <div class="text-center">
    <div class="text-4xl font-bold tabular-nums" :class="timerColor">
      {{ formattedTime }}
    </div>
    <div class="text-sm text-gray-500 mt-1">
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  endTime: number | null;
  label?: string;
}>();

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
  }, 100);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const remainingMs = computed(() => {
  if (!props.endTime) return 0;
  return Math.max(0, props.endTime - now.value);
});

const formattedTime = computed(() => {
  const seconds = Math.ceil(remainingMs.value / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const timerColor = computed(() => {
  const seconds = remainingMs.value / 1000;
  if (seconds <= 5) return 'text-red-500';
  if (seconds <= 15) return 'text-orange-500';
  return 'text-gray-900 dark:text-white';
});
</script>
