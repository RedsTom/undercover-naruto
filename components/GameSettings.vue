<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">&#9881;&#65039; Configuration</h3>
    </template>

    <div class="space-y-6">
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm text-gray-400">Animé</span>
        <span class="text-sm font-bold text-orange-400">{{ animeName || 'Naruto' }}</span>
      </div>

      <GameSelect
        v-if="isHost"
        v-model="selectedMode"
        :items="modeOptions"
        label-key="label"
        value-key="value"
        label="Mode de jeu"
      />

      <div v-if="!isHost" class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm text-gray-400">Mode</span>
        <span class="text-sm font-bold text-white">{{ selectedMode.label }}</span>
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
        <span class="text-sm font-bold text-white">{{ difficultyOptions.find(d => d.value === selectedDifficulty)?.label ?? 'Mixte' }}</span>
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

      <div class="flex flex-col gap-2">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#128220; Époques</p>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="era in eraOptions" :key="era.value" class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" :value="era.value" :checked="selectedEras.includes(era.value)"
              :disabled="!isHost"
              @change="toggleEra(era.value)"
              class="hidden peer" />
            <span :class="[
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
              'bg-white/5 text-[0.7rem]',
              selectedEras.includes(era.value)
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-white/20 hover:border-orange-500/50',
            ]">{{ selectedEras.includes(era.value) ? '&#10003;' : '' }}</span>
            <span class="text-sm" :class="selectedEras.includes(era.value) ? 'text-white' : 'text-gray-500'">{{ era.label }}</span>
          </label>
        </div>
      </div>

      <div v-if="categoryOptions.length > 0" class="flex flex-col gap-2">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#128300; Catégories</p>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="cat in categoryOptions" :key="cat.value" class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" :value="cat.value" :checked="selectedCategories.includes(cat.value)"
              :disabled="!isHost"
              @change="toggleCategory(cat.value)"
              class="hidden peer" />
            <span :class="[
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
              'bg-white/5 text-[0.7rem]',
              selectedCategories.includes(cat.value)
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-white/20 hover:border-orange-500/50',
            ]">{{ selectedCategories.includes(cat.value) ? '&#10003;' : '' }}</span>
            <span class="text-sm" :class="selectedCategories.includes(cat.value) ? 'text-white' : 'text-gray-500'">{{ cat.label }}</span>
          </label>
        </div>
      </div>

      <div class="space-y-4 p-4 rounded-xl bg-white/5">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#127917; Options</p>
        <GameSwitch v-model="mrWhite" label="Activer Mr. White" />
        <GameSwitch v-model="hideRole" label="Masquer les rôles (mode difficile)" />
      </div>

      <GameButton
        v-if="isHost"
        block
        size="lg"
        :disabled="!canStart"
        @click="handleStart"
      >
        {{ inGame ? '&#10145;&#65039; Tour suivant' : (canStart ? '&#128640; Lancer la partie' : `&#9203; ${playerCount}/${minPlayers}`) }}
      </GameButton>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { GameMode, GameConfig, Difficulty } from '~/types';
import { getAnimeManifest } from '~/utils/wordInfo';

const props = defineProps<{
  isHost: boolean;
  playerCount: number;
  minPlayers?: number;
  maxPlayers?: number;
  config?: Partial<GameConfig>;
  inGame?: boolean;
  anime?: string;
}>();

const emit = defineEmits<{
  start: [config: Partial<GameConfig>];
}>();

const modeOptions = [
  { label: 'Classique', value: 'classic' as GameMode },
  { label: 'Double Infiltration', value: 'doubleInfiltration' as GameMode },
];

const difficultyOptions = [
  { label: 'Mixte', value: 'mixed' as Difficulty, desc: 'Toutes difficultés' },
  { label: 'Facile', value: 'easy' as Difficulty, desc: 'Mots très similaires' },
  { label: 'Moyen', value: 'medium' as Difficulty, desc: 'Mots similaires' },
  { label: 'Difficile', value: 'hard' as Difficulty, desc: 'Mots peu similaires' },
];

const selectedMode = ref(modeOptions[0]);
const selectedDifficulty = ref<Difficulty>('mixed');
const selectedCategories = ref<string[]>([]);
const discussionTime = ref(60);
const voteTime = ref(30);
const selectedEras = ref<string[]>([]);
const hideRole = ref(false);
const mrWhite = ref(false);
const eraOptions = ref<Array<{ label: string; value: string }>>([]);
const categoryOptions = ref<Array<{ label: string; value: string }>>([]);
const animeName = ref('');

const minPlayers = computed(() => props.minPlayers ?? 3);

const canStart = computed(() => {
  if (!props.isHost) return false;
  if (props.inGame) return true;
  return props.playerCount >= minPlayers.value && props.playerCount <= maxPlayers.value;
});

const maxPlayers = computed(() => props.maxPlayers ?? 8);

watch(() => props.anime, async (slug) => {
  const manifest = await getAnimeManifest(slug ?? 'naruto');
  if (manifest) {
    animeName.value = manifest.name;
    eraOptions.value = manifest.eras.map(e => ({ label: e.label, value: e.id }));
    categoryOptions.value = Object.entries(manifest.categories).map(([value, label]) => ({ label, value }));
    if (selectedEras.value.length === 0) {
      selectedEras.value = manifest.eras.map(e => e.id);
    }
    if (selectedCategories.value.length === 0) {
      selectedCategories.value = Object.keys(manifest.categories);
    }
  }
}, { immediate: true });

function toggleEra(value: string) {
  if (!props.isHost) return;
  const idx = selectedEras.value.indexOf(value);
  if (idx >= 0) {
    selectedEras.value.splice(idx, 1);
  } else {
    selectedEras.value.push(value);
  }
}

function toggleCategory(value: string) {
  if (!props.isHost) return;
  const idx = selectedCategories.value.indexOf(value);
  if (idx >= 0) {
    selectedCategories.value.splice(idx, 1);
  } else {
    selectedCategories.value.push(value);
  }
}

function handleStart() {
  emit('start', {
    mode: selectedMode.value.value,
    discussionTime: discussionTime.value,
    voteTime: voteTime.value,
    eras: selectedEras.value,
    anime: props.anime ?? 'naruto',
    difficulty: selectedDifficulty.value,
    categories: selectedCategories.value,
    hideRole: hideRole.value,
    mrWhite: mrWhite.value,
  });
}

watch(() => props.config, (cfg) => {
  if (!cfg) return;
  if (cfg.mode) {
    const found = modeOptions.find(m => m.value === cfg.mode);
    if (found) selectedMode.value = found;
  }
  if (cfg.discussionTime) discussionTime.value = cfg.discussionTime;
  if (cfg.voteTime) voteTime.value = cfg.voteTime;
  if (cfg.eras?.length) selectedEras.value = [...cfg.eras];
  if (cfg.categories?.length) selectedCategories.value = [...cfg.categories];
  if (cfg.hideRole !== undefined) hideRole.value = cfg.hideRole;
  if (cfg.mrWhite !== undefined) mrWhite.value = cfg.mrWhite;
  if (cfg.difficulty) selectedDifficulty.value = cfg.difficulty;
}, { immediate: true });
</script>