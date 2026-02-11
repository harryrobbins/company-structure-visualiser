<template>
  <span v-html="formattedAddress"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { CompanyMatch } from '@/api/models.ts'

interface Props {
  company: CompanyMatch
}

const props = defineProps<Props>()

const formattedAddress = computed(() => {
  const addressFields = [
    props.company['RegAddress.CareOf'],
    props.company['RegAddress.POBox'],
    props.company['RegAddress.AddressLine1'],
    props.company['RegAddress.AddressLine2'],
    props.company['RegAddress.PostTown'],
    props.company['RegAddress.County'],
    props.company['RegAddress.Country'],
    props.company['RegAddress.PostCode'],
  ]

  return addressFields.filter((field) => field && field.trim()).join('<br>')
})
</script>
