<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { computed, normalizeClass, provide, useSlots } from 'vue'
import ErrorMessage from '@/components/govuk/ErrorMessage.vue'
import {
  CheckboxesModelValueInjectionKey,
  CheckboxesNameInjectionKey,
  CheckboxesUpdateModelValueFunctionInjectionKey,
} from '@/components/govuk/CheckboxesInjectionKeys.ts'
import { createUid } from '@/composables/useComputedId'
import Fieldset from '@/components/govuk/Fieldset.vue'

// eslint-disable-next-line vue/prefer-import-from-vue
import { looseEqual } from '@vue/shared'

const value = defineModel<any[]>({ required: true })
const props = defineProps({
  /**
   * The value of the `name` attribute to apply to all checkboxes in this group.
   *
   * If you don't provide a name, one will be generated automatically.
   */
  name: String,
  /**
   * The size of the checkboxes in this group.
   */
  size: {
    type: String,
    default: 'normal',
    validator(e: string) {
      return ['normal', 'small'].includes(e)
    },
  },
  //fieldset props
  /**
   * One or more element IDs to add to the `aria-describedby` attribute, used to provide additional descriptive information for screenreader users.
   */
  fieldsetDescribedBy: String,
  /**
   * Classes to add to the fieldset container. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  fieldsetClass: {
    type: [String, Array, Object],
    default: '',
  },
  /**
   * Optional ARIA role attribute to add to the fieldset container.
   */
  fieldsetRole: String,

  //fieldset legend props
  /**
   * Text to use within the legend. If content is provided in the `legend` slot, this prop will be ignored.
   */
  legend: String,
  /**
   * Classes to add to the legend. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  legendClass: {
    type: [String, Array, Object],
    default: '',
  },
  /**
   * Whether the legend also acts as the heading for the page.
   */
  legendIsPageHeading: Boolean,
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
  //Form group props
  /**
   * Classes to add to the form group. You can bind a string, an array or an object, as with normal [Vue class bindings](https://vuejs.org/guide/essentials/class-and-style.html#binding-html-classes).
   */
  formGroupClass: {
    type: [String, Array, Object],
    default: '',
  },
})
const emit = defineEmits(['update:modelValue'])

function updateModelValue(newValue: any | undefined, oldValue: any | undefined, exclusive: boolean = false) {
  if (newValue === undefined && oldValue !== undefined) {
    // If the new value is undefined and the old value is not, the checkbox has been unchecked. Remove its old value from the array
    value.value = value.value.filter((v) => !looseEqual(v, oldValue))
  } else if (newValue !== undefined && oldValue === undefined) {
    if (exclusive) {
      // If this checkbox is exclusive, we want all other checkboxes to be clear so just create a fresh array with the new value
      value.value = [newValue]
    } else {
      // If the new value is defined and the old value is undefined, the checkbox has been checked. Add its new value to the array if it's not already there
      if (!value.value.some((v: any) => looseEqual(v, newValue))) {
        value.value.push(newValue)
      }
    }
  } else if (newValue !== undefined && oldValue !== undefined) {
    // If new and old value are both defined, the value has mutated without the checkbox being checked or unchecked (eg dynamic :value). Remove the old value and add the new one
    const newArray = value.value.filter((v) => !looseEqual(v, oldValue))

    // Only push the new value if it's not already in the array (belt-and-braces, this shouldn't happen in practice unless two checkboxes have been given the same value prop)
    if (!newArray.some((v: any) => looseEqual(v, newValue))) {
      newArray.push(newValue)
    }

    value.value = newArray

    // Emit back to the v-model
    emit('update:modelValue', value.value)
  }
}

provide(CheckboxesUpdateModelValueFunctionInjectionKey, updateModelValue)
provide(CheckboxesModelValueInjectionKey, value)

const slots = useSlots()

const hasHint = computed(() => {
  return props.hint || !!slots.hint
})

const hasErrorMessage = computed(() => {
  return props.errorMessage || !!slots.ErrorMessage
})

const errorMessageId = computed(() => {
  return `${computedName.value}-error`
})

const hintId = computed(() => {
  return `${computedName.value}-hint`
})

const computedName = computed(() => {
  return props.name ? props.name : createUid('checkboxes')
})

provide(CheckboxesNameInjectionKey, computedName)

const computedDescribedBy = computed(() => {
  const value = `${props.fieldsetDescribedBy ? props.fieldsetDescribedBy : ''} ${
    hasHint.value ? hintId.value : ''
  } ${hasErrorMessage.value ? errorMessageId.value : ''}`.trim()
  return value.length > 0 ? value : undefined
})

const normalizedFormGroupClass = computed(() => {
  return normalizeClass(props.formGroupClass)
})
</script>

<template>
  <div :class="`govuk-form-group ${normalizedFormGroupClass} ${hasErrorMessage ? 'govuk-form-group--error' : ''}`">
    <Fieldset
      :described-by="computedDescribedBy"
      :class="fieldsetClass"
      :role="fieldsetRole"
      :legend="legend"
      :legend-class="legendClass"
      :legend-is-page-heading="legendIsPageHeading"
    >
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
      <div
        class="govuk-checkboxes"
        :class="{
          'govuk-checkboxes--small': size === 'small',
        }"
        v-bind="$attrs"
      >
        <slot />
      </div>
    </Fieldset>
  </div>
</template>
