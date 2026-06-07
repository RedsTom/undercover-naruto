<template>
  <GameCard>
    <template #header>
      <h3 class="text-lg font-bold text-white">&#127919; Choix de l'animé</h3>
    </template>

    <div class="space-y-6">
      <div class="space-y-3">
        <p class="block text-xs font-bold uppercase tracking-wider text-white/50">Animé</p>
        <div v-if="isHost" class="grid grid-cols-2 gap-3">
          <button
            v-for="a in animeList" :key="a.slug"
            class="p-4 rounded-xl text-sm font-bold transition-all duration-200"
            :class="selectedAnime === a.slug
              ? 'scale-[0.97] ring-2 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white ring-1 ring-white/10'"
            :style="selectedAnime === a.slug ? { backgroundColor: a.color + '20', borderColor: a.color, boxShadow: `0 0 20px ${a.color}30` } : {}"
            @click="selectAnime(a.slug)"
          >
            {{ a.name }}
          </button>
        </div>
        <div v-else class="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <span class="text-sm text-gray-400">Animé</span>
          <span class="text-sm font-bold text-orange-400">{{ animeName }}</span>
        </div>
      </div>

      <template v-if="selectedAnime">
        <div class="space-y-3">
          <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#128220; Époques</p>
          <div v-if="eraOptions.length > 0" class="grid grid-cols-2 gap-3">
            <label v-for="era in eraOptions" :key="era.value" class="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" :value="era.value" :checked="selectedEras.includes(era.value)"
                :disabled="!isHost"
                @change="toggleEra(era.value)"
                class="hidden peer" />
              <span :class="[
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
                selectedEras.includes(era.value)
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-white/20 bg-white/5 hover:border-orange-500/50',
              ]">{{ selectedEras.includes(era.value) ? '&#10003;' : '' }}</span>
              <span class="text-sm" :class="selectedEras.includes(era.value) ? 'text-white' : 'text-gray-500'">{{ era.label }}</span>
            </label>
          </div>
          <p v-else class="text-sm text-gray-500">Aucune époque disponible</p>
        </div>

        <div v-if="categoryOptions.length > 0" class="space-y-3">
          <p class="block text-xs font-bold uppercase tracking-wider text-white/50">&#128300; Catégories</p>
          <div class="grid grid-cols-2 gap-3">
            <label v-for="cat in categoryOptions" :key="cat.value" class="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" :value="cat.value" :checked="selectedCategories.includes(cat.value)"
                :disabled="!isHost"
                @change="toggleCategory(cat.value)"
                class="hidden peer" />
              <span :class="[
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 text-[0.7rem]',
                selectedCategories.includes(cat.value)
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-white/20 bg-white/5 hover:border-orange-500/50',
              ]">{{ selectedCategories.includes(cat.value) ? '&#10003;' : '' }}</span>
              <span class="text-sm" :class="selectedCategories.includes(cat.value) ? 'text-white' : 'text-gray-500'">{{ cat.label }}</span>
            </label>
          </div>
        </div>
      </template>
    </div>
  </GameCard>
</template>

<script setup lang="ts">
import type { GameConfig } from '~/types';

const props = defineProps<{
  isHost: boolean;
  config?: Partial<GameConfig>;
}>();

const emit = defineEmits<{
  configChanged: [config: Partial<GameConfig>];
}>();

const manifestModules = import.meta.glob('~/data/*/manifest.json', { eager: true, import: 'default' });

const animeList = ref<Array<{ slug: string; name: string; color: string }>>([]);
const selectedAnime = ref('');
const selectedEras = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const eraOptions = ref<Array<{ label: string; value: string }>>([]);
const categoryOptions = ref<Array<{ label: string; value: string }>>([]);
const animeName = ref('');
const manifestLoading = ref(false);

const localAnimeList = computed(() => {
  return Object.entries(manifestModules).map(([path, data]) => {
    const m = data as any;
    return { slug: m.slug, name: m.name, color: m.color };
  });
});

onMounted(async () => {
  if (localAnimeList.value.length > 0) {
    animeList.value = [...localAnimeList.value];
  }
  try {
    const apiList = await $fetch('/api/anime') as any;
    if (apiList.length > 0) {
      animeList.value = apiList;
    }
  } catch {}
  if (!props.config?.anime && animeList.value.length > 0 && !selectedAnime.value) {
    selectedAnime.value = animeList.value[0].slug;
  }
});

watch(() => props.config, async (cfg) => {
  if (!cfg) return;
  if (cfg.anime && cfg.anime !== selectedAnime.value) {
    selectedAnime.value = cfg.anime;
  }
  if (cfg.eras?.length && !arraysEqual(cfg.eras, selectedEras.value)) {
    selectedEras.value = [...cfg.eras];
  }
  if (cfg.categories?.length && !arraysEqual(cfg.categories, selectedCategories.value)) {
    selectedCategories.value = [...cfg.categories];
  }
}, { immediate: true });

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

watch(selectedAnime, async (slug) => {
  if (!slug) return;
  manifestLoading.value = true;
  try {
    const manifest = await $fetch(`/api/anime/${slug}`) as any;
    animeName.value = manifest.name;
    eraOptions.value = manifest.eras.map((e: any) => ({ label: e.label, value: e.id }));
    categoryOptions.value = Object.entries(manifest.categories).map(([value, label]) => ({ label, value }));
    if (selectedEras.value.length === 0) {
      selectedEras.value = manifest.eras.map((e: any) => e.id);
    }
    if (selectedCategories.value.length === 0) {
      selectedCategories.value = Object.keys(manifest.categories);
    }
  } catch {
    animeName.value = slug;
  } finally {
    manifestLoading.value = false;
  }
  emitConfig();
}, { immediate: false });

watch([selectedEras, selectedCategories], () => {
  emitConfig();
}, { deep: true });

function emitConfig() {
  emit('configChanged', {
    anime: selectedAnime.value,
    eras: [...selectedEras.value],
    categories: [...selectedCategories.value],
  });
}

function selectAnime(slug: string) {
  if (!props.isHost) return;
  selectedAnime.value = slug;
  selectedEras.value = [];
  selectedCategories.value = [];
}

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
</script>
