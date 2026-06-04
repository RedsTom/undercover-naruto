<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Configuration du jeu</h3>
    </template>

    <div class="space-y-4">
      <UFormField label="Mode de jeu">
        <USelect
          v-model="selectedMode"
          :options="modeOptions"
          value-key="value"
        />
      </UFormField>

      <UFormField label="Temps de discussion (secondes)">
        <UInput
          v-model.number="discussionTime"
          type="number"
          :min="30"
          :max="120"
        />
      </UFormField>

      <UFormField label="Temps de vote (secondes)">
        <UInput
          v-model.number="voteTime"
          type="number"
          :min="15"
          :max="60"
        />
      </UFormField>

      <USeparator label="Époques" />

      <div class="space-y-2">
        <p class="text-sm text-gray-500">Sélectionnez les époques pour les paires de mots :</p>
        <UCheckboxGroup
          v-model="selectedEras"
          :items="eraOptions"
          value-key="value"
          label-key="label"
        />
      </div>

      <USeparator label="Options" />

      <UCheckbox v-model="mrWhite" label="Activer Mr. White" />
      <p class="text-xs text-gray-400">Un joueur reçoit un mot vide et doit deviner quel mot les autres ont</p>

      <UCheckbox v-model="hideRole" label="Masquer les rôles (mode difficile)" />
      <p class="text-xs text-gray-400">Les joueurs ne voient pas leur rôle, seulement leur mot</p>

      <UButton
        v-if="isHost"
        block
        size="lg"
        :disabled="!canStart"
        @click="handleStart"
      >
        {{ canStart ? 'Lancer la partie' : `En attente de joueurs (${playerCount}/${minPlayers})` }}
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { GameMode, GameConfig, Era } from '~/types';
import { ALL_ERAS } from '~/types';

const props = defineProps<{
  isHost: boolean;
  playerCount: number;
  minPlayers?: number;
  maxPlayers?: number;
}>();

const emit = defineEmits<{
  start: [config: Partial<GameConfig>];
}>();

const eraLabels: Record<Era, string> = {
  'naruto': 'Naruto Original',
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
</script>
