<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">&#9881;&#65039; Configuration générale</h3>
    </template>

    <div class="space-y-6">
      <GameSelect
        v-if="isHost"
        v-model="selectedMode"
        :items="modeOptions"
        label-key="label"
        value-key="value"
        label="Mode de jeu"
      >
        <template #item="{ item }">
          <div class="flex flex-col gap-0.5">
            <span>{{ item.label }}</span>
            <span class="text-xs opacity-60">{{ item.desc }}</span>
          </div>
        </template>
      </GameSelect>

      <div v-if="!isHost" class="flex flex-col items-center justify-between p-3 rounded-xl bg-white/5 gap-1">
        <span class="text-sm text-gray-400">Mode</span>
        <span class="text-sm font-bold text-white">{{ selectedMode.label }}</span>
        <span class="text-xs text-gray-500">{{ selectedMode.desc }}</span>
      </div>

      <GameSelect
        v-if="isHost"
        v-model="selectedDifficulty"
        :items="difficultyOptions"
        label-key="label"
        value-key="value"
        label="Difficulté"
      />

      <div v-if="!isHost" class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm text-gray-400">Difficulté</span>
        <span class="text-sm font-bold text-white">{{ selectedDifficulty.label }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-white/50">Discussion</label>
          <input v-model.number="discussionTime" type="number" :min="30" :max="120" :disabled="!isHost" class="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border placeholder:text-white/25 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] disabled:opacity-50 disabled:cursor-not-allowed" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="block text-xs font-bold uppercase tracking-wider text-white/50">Vote</label>
          <input v-model.number="voteTime" type="number" :min="15" :max="60" :disabled="!isHost" class="w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border placeholder:text-white/25 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)] disabled:opacity-50 disabled:cursor-not-allowed" />
        </div>
      </div>

      <div class="space-y-4 p-4 rounded-xl bg-white/5">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#127917; Options</p>
        <GameSwitch v-model="hideRole" :disabled="!isHost" label="Masquer les rôles (mode difficile)" />
      </div>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { GameMode, GameConfig, Difficulty } from '~/types';

const props = defineProps<{
  isHost: boolean;
  config?: Partial<GameConfig>;
}>();

const emit = defineEmits<{
  configChanged: [config: Partial<GameConfig>];
}>();

const modeOptions = [
  { label: 'Classique', value: 'classic' as GameMode, desc: '1 Undercover se cache parmi les civils', mrWhite: false },
  { label: 'Mr. White', value: 'mrWhiteOnly' as GameMode, desc: '1 Mr. White sans mot cherche à se fondre', mrWhite: true },
  { label: 'Classique + Mr. White', value: 'classic' as GameMode, desc: '1 Undercover + 1 Mr. White sans mot', mrWhite: true },
  { label: 'Double Infiltration', value: 'doubleInfiltration' as GameMode, desc: '2 Undercover se cachant mutuellement (6+ joueurs)', mrWhite: false },
  { label: 'Double Infiltration + Mr. White', value: 'doubleInfiltration' as GameMode, desc: '2 Undercover + 1 Mr. White (6+ joueurs)', mrWhite: true },
];

const difficultyOptions = [
  { label: 'Mixte', value: 'mixed' as Difficulty, desc: 'Toutes difficultés' },
  { label: 'Facile', value: 'easy' as Difficulty, desc: 'Mots très similaires' },
  { label: 'Moyen', value: 'medium' as Difficulty, desc: 'Mots similaires' },
  { label: 'Difficile', value: 'hard' as Difficulty, desc: 'Mots peu similaires' },
];

const selectedMode = ref(modeOptions[0]);
const selectedDifficulty = ref(difficultyOptions[0]);
const discussionTime = ref(60);
const voteTime = ref(30);
const hideRole = ref(false);

function getConfig(): Partial<GameConfig> {
  return {
    mode: selectedMode.value.value,
    discussionTime: discussionTime.value,
    voteTime: voteTime.value,
    difficulty: selectedDifficulty.value.value,
    hideRole: hideRole.value,
    mrWhite: selectedMode.value.mrWhite,
  };
}

watch([selectedMode, selectedDifficulty, discussionTime, voteTime, hideRole], () => {
  emit('configChanged', getConfig());
}, { deep: true });

watch(() => props.config, (cfg) => {
  if (!cfg) return;
  if (cfg.mode) {
    const found = modeOptions.find(m => m.value === cfg.mode && m.mrWhite === (cfg.mrWhite ?? false));
    if (found) selectedMode.value = found;
  }
  if (cfg.discussionTime) discussionTime.value = cfg.discussionTime;
  if (cfg.voteTime) voteTime.value = cfg.voteTime;
  if (cfg.hideRole !== undefined) hideRole.value = cfg.hideRole;
  if (cfg.difficulty) {
    const found = difficultyOptions.find(d => d.value === cfg.difficulty);
    if (found) selectedDifficulty.value = found;
  }
}, { immediate: true });
</script>
