<script setup lang="ts">
import Button from '@/components/govuk/Button.vue'
import NumberedSteps from '@/components/govuk/NumberedSteps.vue'
import NumberedStep from '@/components/govuk/NumberedStep.vue'
</script>

<template>
  <h1 class="govuk-heading-xl">Visualize company structures</h1>
  <p class="govuk-body">Upload company group info to visualize structure.</p>
  <p class="govuk-body">
    GAILZ can be used to fuzzy match provided company data against Companies House data, and to enrich the data with
    additional information such as company status and SIC codes.
  </p>
  <Button :is-start-button="true" :to="{ name: 'upload' }">Upload company data</Button>

  <NumberedSteps title="How it works">
    <NumberedStep color="yellow" title="Upload company data">
      Provide group metadata spreadsheet submission
    </NumberedStep>
    <NumberedStep color="green" title="Review Submission">
      Update the submission with any missing information.
    </NumberedStep>
    <NumberedStep color="blue" title="Enrich with Companies House data">
      GAILZ will attempt to match the provided company data with Companies House data, and will enrich the data with
      additional information such as company status and SIC codes.
    </NumberedStep>
    <NumberedStep color="pink" title="Visualize group structure">
      View the group structure as an interactive graph, and explore the data in more detail.
    </NumberedStep>
  </NumberedSteps>
</template>

<style scoped></style>
