<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="block text-xs font-bold uppercase tracking-wider text-white/50">{{ label }}</label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      :class="[
        'w-full px-4 py-3.5 rounded-xl text-sm text-white bg-white/5 border-2 border-white/10 outline-none transition-all duration-200 box-border',
        'placeholder:text-white/25',
        'focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        mono ? 'text-center text-2xl font-mono tracking-widest' : '',
      ]"
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
