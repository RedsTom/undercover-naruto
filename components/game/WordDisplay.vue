<template>
  <div class="game-card game-card--glow text-center overflow-hidden">
    <div class="p-6 space-y-3">
      <p class="text-sm text-gray-500 font-bold uppercase tracking-wider">
        {{ showWord ? '🎯 Votre mot' : '👁️ Cliquez pour révéler' }}
      </p>

      <div
        class="min-h-[80px] flex items-center justify-center cursor-pointer select-none"
        @click="$emit('toggle')"
      >
        <div v-if="showWord && word" class="space-y-3 animate-bounce-in">
          <p class="text-4xl font-black text-ninja-400">{{ word }}</p>
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            :class="role === 'civil' ? 'bg-leaf-900/30 text-leaf-400 ring-1 ring-leaf-500/30' : role === 'undercover' ? 'bg-akatsuki-900/30 text-akatsuki-400 ring-1 ring-akatsuki-500/30' : 'bg-ninja-900/30 text-ninja-400 ring-1 ring-ninja-500/30'">
            {{ roleLabel }}
          </span>
        </div>
        <div v-else-if="showWord && !word" class="space-y-3 animate-bounce-in">
          <p class="text-3xl font-black text-ninja-400">❓ Mr. White</p>
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-ninja-900/30 text-ninja-400 ring-1 ring-ninja-500/30">
            Vous ne connaissez pas le mot
          </span>
        </div>
        <div v-else class="text-6xl text-gray-600 hover:text-ninja-400 transition-colors duration-300">
          👁️
        </div>
      </div>

      <div v-if="showWord && word && wordDetail" class="mt-4 p-4 rounded-xl bg-white/5 text-left space-y-2 animate-slide-up">
        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold bg-ninja-500/20 text-ninja-400 uppercase tracking-wider">
          {{ categoryLabel }}
        </span>
        <p class="text-sm text-gray-400">{{ wordDetail.description }}</p>
        <div v-if="wordDetail.extra" class="space-y-1 text-xs text-gray-500">
          <div v-for="(value, key) in wordDetail.extra" :key="key" class="flex gap-2">
            <span class="font-medium text-gray-500">{{ key }}:</span>
            <span>{{ value }}</span>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-600 font-medium">🙈 Attention à ne pas montrer votre écran</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWordInfo, getCategoryLabel } from '~/utils/wordInfo';

const props = defineProps<{
  word: string | null;
  role: string | null;
  showWord: boolean;
}>();

defineEmits<{ toggle: [] }>();

const roleLabel = computed(() => {
  switch (props.role) {
    case 'civil': return 'Civil';
    case 'undercover': return 'Intrus';
    case 'mrWhite': return 'Mr. White';
    default: return '';
  }
});

const wordDetail = computed(() => {
  if (!props.word) return null;
  return getWordInfo(props.word);
});

const categoryLabel = computed(() => {
  if (!wordDetail.value) return '';
  return getCategoryLabel(wordDetail.value.category);
});
</script>
