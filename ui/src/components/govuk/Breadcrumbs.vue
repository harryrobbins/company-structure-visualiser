<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { RouterLink, useRoute, type RouteLocationRaw } from 'vue-router'
import type { RouteName } from '@/router.ts'
import { useVisualization } from '@/db/useVisualization.ts'

defineProps<{
  collapseOnMobile?: boolean
}>()

const route = useRoute()
function intParam(name: string): number | null {
  if (name in route.params) {
    const value = route.params[name]
    return typeof value === 'string' ? parseInt(value) : null
  }
  return null
}

const { result: visualization } = useVisualization(() => intParam('uploadId'))

interface Breadcrumb {
  text: string
  location: RouteLocationRaw | null
}

const breadcrumbs = ref<Breadcrumb[]>([])

watchEffect(async () => {
  const crumbs: Breadcrumb[] = [{ text: 'Visualize company structures', location: { name: 'home' } }]
  const uploadId = intParam('uploadId')

  function uploadCrumb() {
    crumbs.push({ text: 'Upload company info', location: { name: 'upload' } })
  }

  function validateCrumb() {
    crumbs.push({
      text: visualization?.value?.filename || 'Validate Upload',
      location: { name: 'validate', params: { uploadId } },
    })
  }

  function matchCrumb() {
    crumbs.push({
      text: 'Match companies',
      location: { name: 'match', params: { uploadId } },
    })
  }

  function visualizeCrumb() {
    crumbs.push({
      text: 'Visualize',
      location: { name: 'visualize', params: { uploadId } },
    })
  }

  switch (route.name as RouteName) {
    case 'upload':
      uploadCrumb()
      break
    case 'validate':
      uploadCrumb()
      validateCrumb()
      break
    case 'match':
      uploadCrumb()
      validateCrumb()
      matchCrumb()
      break
    case 'visualize':
      uploadCrumb()
      validateCrumb()
      visualizeCrumb()
      break
  }

  breadcrumbs.value = crumbs
})
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 1"
    :class="`govuk-breadcrumbs ${collapseOnMobile ? 'govuk-breadcrumbs--collapse-on-mobile' : ''}`"
    aria-label="Breadcrumbs"
  >
    <ol class="govuk-breadcrumbs__list" data-testid="breadcrumbs">
      <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.text">
        <li class="govuk-breadcrumbs__list-item" :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
          <RouterLink
            v-if="breadcrumb.location && index < breadcrumbs.length - 1"
            :to="breadcrumb.location"
            class="govuk-breadcrumbs__link cursor-pointer"
          >
            {{ breadcrumb.text }}
          </RouterLink>
          <template v-else>
            {{ breadcrumb.text }}
          </template>
        </li>
      </template>
    </ol>
  </nav>
</template>
