<template>
  <div class="flex items-center gap-3">
    <Switch
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      class="game-switch"
    >
      <span class="game-switch__thumb" />
    </Switch>
    <span v-if="label" class="text-sm text-gray-300 cursor-pointer" @click="$emit('update:modelValue', !modelValue)">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { Switch } from '@headlessui/vue';

defineProps<{
  modelValue?: boolean;
  label?: string;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>
