<template>
  <div class="text-center">
    <div class="relative inline-flex items-center justify-center">
      <svg class="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8"
          class="text-white/5" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="264"
          :stroke-dashoffset="progressOffset"
          :class="strokeClass"
          class="transition-all duration-300" />
      </svg>
      <span class="absolute text-2xl font-black tabular-nums" :class="timerClass">
        {{ formattedTime }}
      </span>
    </div>
    <div v-if="label" class="text-sm text-gray-500 mt-1 font-bold">
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  endTime: number | null;
  label?: string;
}>();

const emit = defineEmits<{ timeout: [] }>();

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | null = null;
let hasExpired = false;

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
    if (!hasExpired && props.endTime && Date.now() >= props.endTime) {
      hasExpired = true;
      emit('timeout');
    }
  }, 100);
});

watch(() => props.endTime, () => { hasExpired = false; });

onUnmounted(() => { if (interval) clearInterval(interval); });

const remainingMs = computed(() => {
  if (!props.endTime) return 0;
  return Math.max(0, props.endTime - now.value);
});

const totalDuration = computed(() => 60000);

const progressOffset = computed(() => {
  if (!props.endTime) return 0;
  const total = totalDuration.value;
  const remaining = remainingMs.value;
  return 264 * (1 - remaining / total);
});

const formattedTime = computed(() => {
  const seconds = Math.ceil(remainingMs.value / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
});

const timerClass = computed(() => {
  const s = remainingMs.value / 1000;
  if (s <= 5) return 'text-red-400';
  if (s <= 15) return 'text-orange-400';
  return 'text-white';
});

const strokeClass = computed(() => {
  const s = remainingMs.value / 1000;
  if (s <= 5) return 'text-red-500';
  if (s <= 15) return 'text-orange-500';
  return 'text-green-500';
});
</script>
