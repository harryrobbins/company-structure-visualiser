<script setup lang="ts">
import { computed, ref } from 'vue'
import { type RouteLocationRaw, RouterLink } from 'vue-router'

const buttonElement = ref(null)

interface ButtonProps {
  to?: RouteLocationRaw
  isStartButton?: boolean
  variant?: 'primary' | 'secondary' | 'warning'
  href?: string
  disabled?: boolean
  id?: string
  name?: string
  type?: 'submit' | 'reset' | 'button'
  value?: string | number | readonly string[]
}

const props = defineProps<ButtonProps>()

const computedElement = computed(() => {
  if (props.to) {
    return RouterLink
  } else if (props.href) {
    return 'a'
  } else if (props.value) {
    return 'input'
  } else {
    return 'button'
  }
})

const isLink = computed(() => props.to || props.href)
const isInput = computed(() => computedElement.value === 'input')

/**
 * Trigger a click event when the space key is pressed
 *
 * Some screen readers tell users they can activate things with the 'button'
 * role, so we need to match the functionality of native HTML buttons
 *
 * See https://github.com/alphagov/govuk_elements/pull/272#issuecomment-233028270
 */
function handleKeyDownSpace(): void {
  if (computedElement.value === 'a' && buttonElement.value) {
    const button: HTMLAnchorElement = buttonElement.value
    button.click()
  }
}
</script>

<template>
  <component
    ref="buttonElement"
    :is="computedElement"
    :id="id"
    :name="name"
    class="govuk-button"
    :class="{
      'govuk-button--primary': variant === 'primary' || !variant,
      'govuk-button--secondary': variant === 'secondary',
      'govuk-button--warning': variant === 'warning',
      'govuk-button--start': isStartButton,
    }"
    :disabled="disabled ? 'disabled' : null"
    :aria-disabled="disabled ? 'true' : null"
    :role="isLink ? 'button' : null"
    :draggable="isLink ? 'false' : null"
    :type="isLink ? null : type"
    :to="isLink ? to : null"
    :href="computedElement === 'a' ? href : null"
    v-on:keydown.space="handleKeyDownSpace"
  >
    <template v-if="!isInput">
      <slot />
      <svg
        v-if="isStartButton"
        class="govuk-button__start-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="17.5"
        height="19"
        viewBox="0 0 33 40"
        aria-hidden="true"
        focusable="false"
      >
        <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
      </svg>
    </template>
  </component>
</template>

<style scoped>
.govuk-button--primary {
  background-color: var(--color-teal-500);
  color: var(--color-white);

  &:hover {
    background-color: var(--color-teal-600);
  }
}
</style>
