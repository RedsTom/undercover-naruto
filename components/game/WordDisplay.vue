<template>
  <UCard>
    <div class="text-center space-y-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ showWord ? 'Votre mot est' : 'Cliquez pour révéler' }}
      </div>

      <div
        class="min-h-[100px] flex items-center justify-center cursor-pointer"
        @click="$emit('toggle')"
      >
        <div v-if="showWord && word" class="space-y-3">
          <p class="text-3xl font-bold text-primary">{{ word }}</p>
          <UBadge :color="roleColor" variant="subtle">
            {{ roleLabel }}
          </UBadge>
        </div>
        <div v-else-if="showWord && !word" class="space-y-3">
          <p class="text-2xl font-bold text-orange-500">Mr. White</p>
          <UBadge color="orange" variant="subtle">
            Vous ne connaissez pas le mot
          </UBadge>
        </div>
        <UIcon
          v-else
          name="i-heroicons-eye"
          class="w-16 h-16 text-gray-400"
        />
      </div>

      <div v-if="showWord && word && wordDetail" class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
        <div class="flex items-center gap-2 mb-2">
          <UBadge color="primary" variant="outline" size="xs">
            {{ categoryLabel }}
          </UBadge>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {{ wordDetail.description }}
        </p>
        <div v-if="wordDetail.extra" class="space-y-1">
          <div
            v-for="(value, key) in wordDetail.extra"
            :key="key"
            class="flex items-center gap-2 text-sm"
          >
            <span class="font-medium text-gray-500">{{ key }}:</span>
            <span class="text-gray-700 dark:text-gray-300">{{ value }}</span>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-400">
        Attention à ne pas montrer votre écran!
      </p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { getWordInfo, getCategoryLabel } from '~/utils/wordInfo';

const props = defineProps<{
  word: string | null;
  role: string | null;
  showWord: boolean;
}>();

defineEmits<{
  toggle: [];
}>();

const roleColor = computed(() => {
  switch (props.role) {
    case 'civil': return 'green';
    case 'undercover': return 'red';
    case 'mrWhite': return 'orange';
    default: return 'gray';
  }
});

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
