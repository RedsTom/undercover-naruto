<template>
  <div>
    <label v-if="label" class="game-label">{{ label }}</label>
    <Listbox :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <div class="game-listbox">
        <ListboxButton class="game-listbox__button">
          <span>{{ selectedLabel }}</span>
          <span class="text-gray-500 text-xs">▼</span>
        </ListboxButton>
        <ListboxOptions class="game-listbox__options">
          <ListboxOption
            v-for="item in items"
            :key="item[valueKey]"
            :value="item"
            as="template"
          >
            <li class="game-listbox__option">
              {{ item[labelKey] }}
            </li>
          </ListboxOption>
        </ListboxOptions>
      </div>
    </Listbox>
  </div>
</template>

<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';

const props = withDefaults(defineProps<{
  modelValue?: any;
  items?: any[];
  labelKey?: string;
  valueKey?: string;
  label?: string;
}>(), {
  modelValue: null,
  items: () => [],
  labelKey: 'label',
  valueKey: 'value',
  label: '',
});

defineEmits<{
  'update:modelValue': [value: any];
}>();

const selectedLabel = computed(() => {
  if (!props.modelValue) return 'Sélectionner';
  return props.modelValue[props.labelKey] || props.modelValue;
});
</script>
