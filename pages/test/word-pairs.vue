<template>
  <div class="min-h-screen pb-16">
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-black text-white">Générateur de paires</h1>
        <p class="text-gray-400">Visualisez les paires de mots possibles par animé</p>
      </div>

      <div class="flex flex-wrap gap-3 justify-center">
        <button
          v-for="a in animeList" :key="a.slug"
          class="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
          :class="selectedAnime === a.slug ? 'scale-[0.97] text-white ring-2' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white ring-1 ring-white/10'"
          :style="selectedAnime === a.slug ? { backgroundColor: a.color + '20', borderColor: a.color, boxShadow: `0 0 20px ${a.color}30` } : {}"
          @click="selectAnime(a.slug)"
        >
          {{ a.name }}
        </button>
      </div>

      <div v-if="selectedAnime && manifest" class="space-y-4">
        <div class="flex flex-wrap gap-3 justify-center">
          <label v-for="era in manifest.eras" :key="era.id" class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" :value="era.id" :checked="selectedEras.includes(era.id)" @change="toggleEra(era.id)" class="hidden peer" />
            <span :class="[
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
              'bg-white/5',
              selectedEras.includes(era.id)
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-white/20 hover:border-orange-500/50',
            ]">{{ selectedEras.includes(era.id) ? '&#10003;' : '' }}</span>
            <span class="text-sm" :class="selectedEras.includes(era.id) ? 'text-white' : 'text-gray-500'">{{ era.label }}</span>
          </label>
        </div>

        <div class="flex flex-wrap gap-3 justify-center">
          <label v-for="[key, label] in Object.entries(manifest.categories)" :key="key" class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" :value="key" :checked="selectedCategories.includes(key)" @change="toggleCategory(key)" class="hidden peer" />
            <span :class="[
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
              'bg-white/5',
              selectedCategories.includes(key)
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-white/20 hover:border-orange-500/50',
            ]">{{ selectedCategories.includes(key) ? '&#10003;' : '' }}</span>
            <span class="text-sm" :class="selectedCategories.includes(key) ? 'text-white' : 'text-gray-500'">{{ label }}</span>
          </label>
        </div>

        <div class="flex items-center gap-4 justify-center">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-400">Tags en commun min :</label>
            <select v-model.number="minOverlap" class="px-3 py-2 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none">
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
              <option :value="5">5</option>
              <option :value="6">6+</option>
            </select>
          </div>
          <p class="text-sm text-gray-500">
            <span class="text-orange-400 font-bold">{{ filteredPairs.length }}</span> paires
          </p>
        </div>

        <div class="flex gap-2 justify-center">
          <button
            v-for="d in difficulties" :key="d.value"
            class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
            :class="selectedDifficulty === d.value ? 'text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'"
            :style="selectedDifficulty === d.value ? { backgroundColor: d.color + '30', color: d.color } : {}"
            @click="selectedDifficulty = selectedDifficulty === d.value ? null : d.value"
          >
            {{ d.label }}
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-sm font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            @click="selectedDifficulty = null"
          >
            Toutes
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center text-gray-500 py-12">
        Chargement...
      </div>

      <div v-else-if="selectedAnime && filteredPairs.length > 0" class="space-y-2">
        <div
          v-for="pair in displayedPairs" :key="pair.wordA + pair.wordB"
          class="p-4 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-between gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-white font-bold">{{ pair.wordA }}</span>
              <span class="text-gray-500">vs</span>
              <span class="text-white font-bold">{{ pair.wordB }}</span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded bg-white/5 text-orange-400 font-bold uppercase tracking-wider">{{ categoryLabel(pair.category) }}</span>
              <span class="text-xs text-gray-500">{{ pair.overlap }} tags</span>
            </div>
          </div>
          <span
            class="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider"
            :class="pair.difficulty === 'easy' ? 'bg-green-500/15 text-green-400' : pair.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'"
          >
            {{ pair.difficulty === 'easy' ? 'Facile' : pair.difficulty === 'medium' ? 'Moyen' : 'Difficile' }}
          </span>
        </div>

        <div v-if="filteredPairs.length > pageSize" class="text-center pt-4">
          <button
            class="px-6 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white ring-1 ring-white/10 transition-all"
            @click="pageSize += 50"
          >
            Charger plus ({{ Math.min(pageSize, filteredPairs.length) }}/{{ filteredPairs.length }})
          </button>
        </div>
      </div>

      <div v-else-if="selectedAnime && !loading" class="text-center text-gray-500 py-12">
        Aucune paire trouvée avec ces filtres
      </div>

      <div class="text-center">
        <GameButton variant="ghost" @click="navigateTo('/')">&#8592; Retour</GameButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const animeList = ref<Array<{ slug: string; name: string; color: string }>>([]);
const selectedAnime = ref('naruto');
const manifest = ref<any>(null);
const selectedEras = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const minOverlap = ref(3);
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | null>(null);
const allPairs = ref<any[]>([]);
const loading = ref(false);
const pageSize = ref(50);

const difficulties = [
  { value: 'easy' as const, label: 'Facile', color: '#4ade80' },
  { value: 'medium' as const, label: 'Moyen', color: '#facc15' },
  { value: 'hard' as const, label: 'Difficile', color: '#f87171' },
];

const filteredPairs = computed(() => {
  let pairs = allPairs.value;
  if (selectedDifficulty.value) {
    pairs = pairs.filter(p => p.difficulty === selectedDifficulty.value);
  }
  if (selectedCategories.value.length > 0) {
    pairs = pairs.filter(p => selectedCategories.value.includes(p.category));
  }
  return pairs;
});

const displayedPairs = computed(() => filteredPairs.value.slice(0, pageSize.value));

function categoryLabel(cat: string): string {
  if (!manifest.value) return cat;
  return manifest.value.categories?.[cat] ?? cat;
}

function toggleEra(id: string) {
  const idx = selectedEras.value.indexOf(id);
  if (idx >= 0) selectedEras.value.splice(idx, 1);
  else selectedEras.value.push(id);
}

function toggleCategory(key: string) {
  const idx = selectedCategories.value.indexOf(key);
  if (idx >= 0) selectedCategories.value.splice(idx, 1);
  else selectedCategories.value.push(key);
}

async function selectAnime(slug: string) {
  selectedAnime.value = slug;
  selectedEras.value = [];
  selectedCategories.value = [];
  minOverlap.value = 3;
  selectedDifficulty.value = null;
  pageSize.value = 50;
  await loadAnime();
}

async function loadAnime() {
  loading.value = true;
  allPairs.value = [];
  try {
    const m = await $fetch(`/api/anime/${selectedAnime.value}`) as any;
    manifest.value = m;
    selectedEras.value = m.eras.map((e: any) => e.id);
    const data = await $fetch('/api/word-pairs', {
      method: 'POST',
      body: { anime: selectedAnime.value, eras: selectedEras.value, minOverlap: 3 },
    }) as any;
    allPairs.value = data.pairs ?? [];
  } catch {
    manifest.value = null;
    allPairs.value = [];
  }
  loading.value = false;
}

watch([selectedEras, minOverlap], async () => {
  if (!selectedAnime.value) return;
  loading.value = true;
  pageSize.value = 50;
  try {
    const data = await $fetch('/api/word-pairs', {
      method: 'POST',
      body: { anime: selectedAnime.value, eras: selectedEras.value, minOverlap: minOverlap.value },
    }) as any;
    allPairs.value = data.pairs ?? [];
  } catch {
    allPairs.value = [];
  }
  loading.value = false;
}, { deep: true });

onMounted(async () => {
  try {
    animeList.value = await $fetch('/api/anime') as any;
  } catch {}
  await loadAnime();
});
</script>