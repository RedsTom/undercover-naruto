<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">⚙️ Configuration</h3>
    </template>

    <div class="space-y-5">
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

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="game-label">Discussion</label>
          <input v-model.number="discussionTime" type="number" :min="30" :max="120" :disabled="!isHost" class="game-input" />
        </div>
        <div>
          <label class="game-label">Vote</label>
          <input v-model.number="voteTime" type="number" :min="15" :max="60" :disabled="!isHost" class="game-input" />
        </div>
      </div>

      <div>
        <p class="game-label">📜 Époques</p>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="era in eraOptions" :key="era.value" class="game-checkbox">
            <input type="checkbox" :value="era.value" :checked="selectedEras.includes(era.value)"
              :disabled="!isHost"
              @change="toggleEra(era.value)" />
            <span class="game-checkbox__visual">{{ selectedEras.includes(era.value) ? '✓' : '' }}</span>
            <span class="text-sm" :class="selectedEras.includes(era.value) ? 'text-white' : 'text-gray-500'">{{ era.label }}</span>
          </label>
        </div>
      </div>

      <div class="space-y-3 p-4 rounded-xl bg-white/5">
        <p class="game-label">🎭 Options</p>
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
        {{ canStart ? '🚀 Lancer la partie' : `⏳ ${playerCount}/${minPlayers}` }}
      </GameButton>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { GameMode, GameConfig, Era } from '~/types';
import { ALL_ERAS } from '~/types';

const props = defineProps<{
  isHost: boolean;
  playerCount: number;
  minPlayers?: number;
  maxPlayers?: number;
  config?: Partial<GameConfig>;
}>();

const emit = defineEmits<{
  start: [config: Partial<GameConfig>];
}>();

const eraLabels: Record<Era, string> = {
  'naruto': 'Original',
  'shippuden': 'Shippuden',
  'shippuden-end': 'Fin Shippuden',
  'boruto': 'Boruto',
  'naruto-backstory': 'Flashback',
};

const eraOptions = ALL_ERAS.map(e => ({ label: eraLabels[e], value: e }));

const minPlayers = computed(() => props.minPlayers ?? 3);

const modeOptions = [
  { label: 'Classique', value: 'classic' as GameMode },
  { label: 'Double Infiltration', value: 'doubleInfiltration' as GameMode },
];

const selectedMode = ref(modeOptions[0]);
const discussionTime = ref(60);
const voteTime = ref(30);
const selectedEras = ref<string[]>([...ALL_ERAS]);
const hideRole = ref(false);
const mrWhite = ref(false);

const canStart = computed(() => {
  return props.isHost && props.playerCount >= minPlayers.value && props.playerCount <= maxPlayers.value;
});

const maxPlayers = computed(() => props.maxPlayers ?? 8);

function toggleEra(value: string) {
  if (!props.isHost) return;
  const idx = selectedEras.value.indexOf(value);
  if (idx >= 0) {
    selectedEras.value.splice(idx, 1);
  } else {
    selectedEras.value.push(value);
  }
}

function handleStart() {
  emit('start', {
    mode: selectedMode.value.value,
    discussionTime: discussionTime.value,
    voteTime: voteTime.value,
    eras: selectedEras.value,
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
  if (cfg.hideRole !== undefined) hideRole.value = cfg.hideRole;
  if (cfg.mrWhite !== undefined) mrWhite.value = cfg.mrWhite;
}, { immediate: true });
</script>
