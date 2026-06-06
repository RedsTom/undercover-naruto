<template>
  <div>
    <label v-if="label" class="game-label">{{ label }}</label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      class="game-input"
      :class="{ 'text-center text-2xl font-mono tracking-widest': mono }"
      @input="handleInput"
      @keyup.enter="$emit('enter')"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxlength?: number;
  mono?: boolean;
}>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  mono: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  enter: [];
}>();

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>
