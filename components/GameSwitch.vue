<template>
  <div class="flex items-center gap-3">
    <Switch
      :model-value="modelValue"
      @update:model-value="disabled ? undefined : $emit('update:modelValue', $event)"
      :disabled="disabled"
      :class="[
        'relative inline-flex items-center h-6 w-11 rounded-full transition-all duration-200 border-none outline-none',
        modelValue ? 'bg-orange-500' : 'bg-white/15',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90',
      ]"
    >
      <span :class="[
        'inline-block w-5 h-5 rounded-full bg-white transition-all duration-200',
        modelValue ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
      ]" />
    </Switch>
    <span v-if="label" class="text-sm" :class="disabled ? 'text-gray-600' : 'text-gray-300 cursor-pointer'" @click="disabled ? undefined : $emit('update:modelValue', !modelValue)">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Switch } from '@headlessui/vue';

defineProps<{
  modelValue?: boolean;
  label?: string;
  disabled?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>
