<template>
  <div class="bg-gradient-to-br from-[#1a1a3e] via-[#16213e] to-[#0f3460] border border-orange-500/15 rounded-2xl shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.3)] text-center overflow-hidden">
    <div class="p-6 space-y-3">
      <p class="text-sm text-gray-500 font-bold uppercase tracking-wider">
        {{ showWord ? '&#127919; Votre mot' : '&#128065;&#65039; Cliquez pour révéler' }}
      </p>

      <div
        class="min-h-[80px] flex items-center justify-center cursor-pointer select-none"
        @click="$emit('toggle')"
      >
        <div v-if="showWord && word" class="space-y-3 animate-bounce-in">
          <p class="text-4xl font-black text-orange-400">{{ word }}</p>
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            :class="role === 'civil' ? 'bg-green-900/30 text-green-400 ring-1 ring-green-500/30' : role === 'undercover' ? 'bg-red-900/30 text-red-400 ring-1 ring-red-500/30' : 'bg-orange-900/30 text-orange-400 ring-1 ring-orange-500/30'">
            {{ roleLabel }}
          </span>
        </div>
        <div v-else-if="showWord && !word" class="space-y-3 animate-bounce-in">
          <p class="text-3xl font-black text-orange-400">&#10067; Mr. White</p>
          <span class="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-900/30 text-orange-400 ring-1 ring-orange-500/30">
            Vous ne connaissez pas le mot
          </span>
        </div>
        <div v-else class="text-6xl text-gray-600 hover:text-orange-400 transition-colors duration-300">
          &#128065;&#65039;
        </div>
      </div>

      <div v-if="showWord && word && wordDetail" class="mt-4 p-4 rounded-xl bg-white/5 text-left space-y-2 animate-slide-up">
        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 uppercase tracking-wider">
          {{ categoryLabel }}
        </span>
        <p class="text-sm text-gray-400">{{ wordDetail.summary }}</p>
        <ul v-if="wordDetail.details?.length" class="space-y-1 text-xs text-gray-500">
          <li v-for="detail in wordDetail.details" :key="detail" class="flex items-start gap-1.5">
            <span class="text-orange-400 mt-0.5">&#8226;</span>
            <span>{{ detail }}</span>
          </li>
        </ul>
      </div>

      <p class="text-xs text-gray-600 font-medium">&#128584; Attention à ne pas montrer votre écran</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWordInfo, getCategoryLabel } from '~/utils/wordInfo';

const props = defineProps<{
  word: string | null;
  role: string | null;
  showWord: boolean;
  anime?: string;
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
  return getWordInfo(props.anime ?? 'naruto', props.word);
});

const categoryLabel = ref('');

watch(wordDetail, async (detail) => {
  if (detail?.category) {
    categoryLabel.value = await getCategoryLabel(props.anime ?? 'naruto', detail.category);
  }
}, { immediate: true });
</script>