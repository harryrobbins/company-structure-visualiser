<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { useSlots } from 'vue'
import { computed, normalizeClass, ref, toRef, watch } from 'vue'
import { useComputedId } from '@/composables/useComputedId.ts'
import ErrorMessage from '@/components/govuk/ErrorMessage.vue'

const value = defineModel<string | number | boolean | object>()
const props = defineProps({
  /**
   * The ID for the select element.
   *
   * If you don't provide an ID, one will be generated automatically.
   */
  id: String,
  /**
   * The value of the `name` attribute for the select element.
   */
  name: String,
  /**
   * One or more element IDs to add to the `aria-describedby` attribute, used to provide additional descriptive information for screenreader users.
   */
  describedBy: String,
  /**
   * If `true`, select box will be disabled. Use the `disabled` prop on each individual item to only disable certain options.
   */
  disabled: Boolean,
  //Label props
  /**
   * Text to use within the label. If content is provided in the default slot, this prop will be ignored.
   */
  label: String,
  /**
   * Classes to add to the label tag. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  labelClass: {
    type: [String, Array, Object],
    default: '',
  },
  //hint props
  /**
   * Text to use within the hint. If content is provided in the `hint` slot, this prop will be ignored.
   */
  hint: String,
  /**
   * Classes to add to the hint span tag. You can bind a string, an array or an object, as with normal
   * [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  hintClass: {
    type: [String, Array, Object],
    default: '',
  },
  //error message props
  /**
   * Text to use within the error message. If content is provided in the `error-message` slot, this prop will be ignored.
   */
  errorMessage: String,
  /**
   * Classes to add to the error message `<p>` tag. You can bind a string, an array or an object, as with normal
   * [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  errorMessageClass: {
    type: [String, Array, Object],
    default: '',
  },
  /**
   * A visually hidden prefix used before the error message.
   *
   * Defaults to `'Error'`.
   */
  errorMessageVisuallyHiddenText: String,
  //Form group props
  /**
   * Classes to add to the form group. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  formGroupClass: {
    type: [String, Array, Object],
    default: '',
  },
  /**
   * Text to add before the select. If content is provided in the `before-input` slot, this prop will be ignored.
   */
  beforeInput: {
    type: String,
  },
  /**
   * Text to add after the select. If content is provided in the `after-input` slot, this prop will be ignored.
   */
  afterInput: {
    type: String,
  },
})
const emit = defineEmits(['update:modelValue'])

const modelValueMutable = ref(value)

watch(modelValueMutable, (newModelValueMutable) => {
  emit('update:modelValue', newModelValueMutable)
})

const slots = useSlots()

const hasLabel = computed(() => {
  return props.label || !!slots.label
})

const hasHint = computed(() => {
  return props.hint || !!slots.hint
})

const hasErrorMessage = computed(() => {
  return props.errorMessage || !!slots.errorMessage
})

const errorMessageId = computed(() => {
  return `${computedId.value}-error`
})

const hintId = computed(() => {
  return `${computedId.value}-hint`
})

const computedId = useComputedId(toRef(props, 'id'), 'select')

const computedDescribedBy = computed(() => {
  const value = `${props.describedBy ? props.describedBy : ''} ${
    hasHint.value ? hintId.value : ''
  } ${hasErrorMessage.value ? errorMessageId.value : ''}`.trim()
  return value.length > 0 ? value : undefined
})

const normalizedFormGroupClass = computed(() => {
  return normalizeClass(props.formGroupClass)
})
</script>

<template>
  <div
    :class="`govuk-form-group ${normalizedFormGroupClass} ${
      hasErrorMessage ? 'govuk-form-group--error' : ''
    }`"
  >
    <label v-if="hasLabel" :for="computedId" class="govuk-label" :class="labelClass">
      <!-- @slot The content of the label. If content is provided in this slot, the `label` prop will be ignored. -->
      <slot name="label">
        {{ label }}
      </slot>
    </label>
    <div v-if="hasHint" class="govuk-hint" :class="hintClass" :id="hintId">
      <!-- @slot The content of the hint. If content is provided in this slot, the `hint` prop will be ignored. -->
      <slot name="hint">
        {{ hint }}
      </slot>
    </div>
    <ErrorMessage
      v-if="hasErrorMessage"
      :text="errorMessage"
      :class="errorMessageClass"
      :id="errorMessageId"
      :visually-hidden-text="errorMessageVisuallyHiddenText"
    >
      <!-- @slot The content of the error message. If content is provided in this slot, the `errorMessage` prop will be ignored. -->
      <slot name="error-message" />
    </ErrorMessage>
    <!-- @slot Content to add before the select. If content is provided in this slot, the `beforeInput` prop will be ignored. -->
    <slot name="before-input">
      {{ beforeInput }}
    </slot>
    <select
      :id="computedId"
      :name="name"
      class="govuk-select"
      :class="{
        'govuk-select--error': hasErrorMessage,
      }"
      v-model="modelValueMutable"
      :disabled="disabled"
      :aria-describedby="computedDescribedBy"
      v-bind="$attrs"
    >
      <!-- @slot A list of `GvSelectOption`s -->
      <slot />
    </select>
    <!-- @slot Content to add after the select. If content is provided in this slot, the `afterInput` prop will be ignored. -->
    <slot name="after-input">
      {{ afterInput }}
    </slot>
  </div>
</template>
