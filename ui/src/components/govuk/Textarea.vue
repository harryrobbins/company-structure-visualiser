<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { computed, normalizeClass, toRef, useSlots } from 'vue'
import ErrorMessage from '@/components/govuk/ErrorMessage.vue'
import { useComputedId } from '@/composables/useComputedId'

const value = defineModel<string>()
const props = defineProps({
  /**
   * The ID for this textarea.
   *
   * If you don't provide an ID, one will be generated automatically.
   */
  id: String,
  /**
   * The name of the textarea, which is submitted with the form data.
   */
  name: String,
  /**
   * Number of textarea rows
   */
  rows: {
    type: Number,
    default: 5,
  },
  /**
   * 	One or more element IDs to add to the `aria-describedby` attribute, used to provide additional descriptive information for screenreader users.
   */
  describedBy: String,
  /**
   * Attribute to [identify input purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html),
   * for example `street-address`. See [autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill)
   * for full list of values that can be used.
   */
  autocomplete: String,
  /**
   * Sets the `spellcheck` attribute on the textarea
   */
  spellcheck: {
    type: Boolean,
    default: null,
  },
  /**
   * If `true`, textarea will be disabled.
   */
  disabled: Boolean,
  //Form group props
  /**
   * Classes to add to the form group. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  formGroupClass: {
    type: [String, Array, Object],
    default: '',
  },
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
   * Classes to add to the hint span tag. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
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
   * Classes to add to the error message `<p>` tag. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
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
  /**
   * Text to add before the textarea. If content is provided in the `before-input` slot, this prop will be ignored.
   */
  beforeInput: {
    type: String,
  },
  /**
   * Text to add after the textarea. If content is provided in the `after-input` slot, this prop will be ignored.
   */
  afterInput: {
    type: String,
  },
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

const computedId = useComputedId(toRef(props, 'id'), 'textarea')

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
      <slot name="label">{{ label }}</slot>
    </label>
    <div v-if="hasHint" class="govuk-hint" :class="hintClass" :id="hintId">
      <!-- @slot The content of the hint. If content is provided in this slot, the `hint` prop will be ignored. -->
      <slot name="hint">{{ hint }}</slot>
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
    <!-- @slot Content to add before the textarea. If content is provided in this slot, the `beforeInput` prop will be ignored. -->
    <slot name="before-input">
      {{ beforeInput }}
    </slot>
    <textarea
      :id="computedId"
      :name="name"
      class="govuk-textarea"
      :class="{
        'govuk-textarea--error': hasErrorMessage,
      }"
      :rows="rows"
      :spellcheck="spellcheck === null ? undefined : spellcheck"
      :disabled="disabled"
      :aria-describedby="computedDescribedBy"
      :autocomplete="autocomplete"
      v-model="value"
      v-bind="$attrs"
    ></textarea>
    <!-- @slot Content to add after the textarea. If content is provided in this slot, the `afterInput` prop will be ignored. -->
    <slot name="after-input">
      {{ afterInput }}
    </slot>
  </div>
</template>
