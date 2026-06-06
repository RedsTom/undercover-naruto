<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="block text-xs font-bold uppercase tracking-wider text-white/50">{{ label }}</label>
    <Listbox :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <div class="relative">
        <ListboxButton :class="[
          'flex items-center justify-between gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white',
          'bg-white/10 border-2 border-white/10 cursor-pointer transition-all duration-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-left outline-none',
          'shadow-[0_4px_0_rgba(0,0,0,0.25),0_6px_12px_rgba(0,0,0,0.2)]',
          'focus:border-orange-500',
          'hover:-translate-y-px hover:bg-white/10 hover:shadow-[0_5px_0_rgba(0,0,0,0.25),0_8px_16px_rgba(0,0,0,0.25)]',
          'active:translate-y-[3px] active:shadow-[0_1px_0_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.15)]',
        ]">
          <span>{{ selectedLabel }}</span>
          <span class="text-gray-500 text-xs">&#9660;</span>
        </ListboxButton>
        <ListboxOptions :class="[
          'absolute z-50 mt-1 w-full rounded-xl bg-[#1a1a3e] border border-white/10',
          'shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden outline-none',
        ]">
          <ListboxOption
            v-for="item in items"
            :key="item[valueKey]"
            :value="item"
            as="template"
          >
            <li :class="[
              'px-4 py-3 text-sm font-semibold text-white/80 cursor-pointer transition-all duration-100 outline-none',
              'data-[active]:bg-orange-500/15 data-[active]:text-white',
              'data-[selected]:text-orange-400',
            ]">
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
