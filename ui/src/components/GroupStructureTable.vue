<script setup lang="ts">
import { ref, watch } from 'vue'
import { type Entity, ENTITY_TYPES } from '@/db/models'
import GvInput from '@/components/govuk/Input.vue'
import GvSelect from '@/components/govuk/Select.vue'
import GvButton from '@/components/govuk/Button.vue'

import { deepToRaw } from '@/vue-extra.ts'

interface Props {
  entities: Entity[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [entities: Entity[]]
}>()

const originalEntities = ref<Entity[]>(deepToRaw(props.entities))
const entities = ref<Entity[]>(deepToRaw(props.entities))
watch(
  props.entities,
  (newEntities) => {
    originalEntities.value = deepToRaw(newEntities)
    entities.value = deepToRaw(newEntities)
  },
  { deep: true },
)

const editingEntity = ref<number | null>(null)

function startEditEntity(index: number) {
  editingEntity.value = index
}

function confirmEditEntity() {
  if (editingEntity.value === null) {
    return
  }
  originalEntities.value = deepToRaw(entities.value)
  editingEntity.value = null
  emit('save', entities.value)
}

function cancelEditEntity() {
  if (editingEntity.value === null) {
    return
  }
  const originalEntity = originalEntities.value[editingEntity.value]
  if (originalEntity) {
    entities.value[editingEntity.value] = deepToRaw(originalEntity)
  }
  editingEntity.value = null
}
</script>

<template>
  <div class="group-structure-table">
    <h1 class="govuk-heading-xl">Confirm company details</h1>

    <p class="govuk-body">
      Check and confirm the details of these companies from your document are correct before running the visualisation.
    </p>

    <table class="govuk-table">
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header">Name</th>
          <th scope="col" class="govuk-table__header">TIN</th>
          <th scope="col" class="govuk-table__header">Type</th>
          <th scope="col" class="govuk-table__header">Tax Jurisdiction</th>
          <th scope="col" class="govuk-table__header">Incorporation Jurisdiction</th>
          <th scope="col" class="govuk-table__header">Actions</th>
        </tr>
      </thead>
      <tbody class="govuk-table__body">
        <tr class="govuk-table__row" v-for="(entity, index) in entities" :key="index">
          <template v-if="editingEntity === index">
            <td class="govuk-table__cell">
              <GvInput v-model="entity.name" :id="`entity-name-${index}`" form-group-class="mb-0!" />
            </td>
            <td class="govuk-table__cell">
              <GvInput v-model="entity.tin" :id="`entity-tin-${index}`" form-group-class="mb-0!" />
            </td>
            <td class="govuk-table__cell">
              <GvSelect v-model="entity.type" :id="`entity-type-${index}`" form-group-class="mb-0!">
                <option v-for="type in ENTITY_TYPES" :key="type" :value="type">
                  {{ type }}
                </option>
              </GvSelect>
            </td>
            <td class="govuk-table__cell">
              <GvInput
                v-model="entity.taxJurisdiction"
                :id="`entity-tax-jurisdiction-${index}`"
                form-group-class="mb-0!"
              />
            </td>
            <td class="govuk-table__cell">
              <GvInput
                v-model="entity.taxJurisdictionOfIncorporation"
                :id="`entity-incorporation-${index}`"
                form-group-class="mb-0!"
              />
            </td>
            <td class="govuk-table__cell">
              <div class="flex gap-2">
                <GvButton @click="confirmEditEntity" class="mb-0!">Save</GvButton>
                <GvButton @click="cancelEditEntity" variant="secondary" class="mb-0!">Cancel</GvButton>
              </div>
            </td>
          </template>
          <template v-else>
            <td class="govuk-table__cell">{{ entity.name }}</td>
            <td class="govuk-table__cell">{{ entity.tin }}</td>
            <td class="govuk-table__cell">{{ entity.type }}</td>
            <td class="govuk-table__cell">{{ entity.taxJurisdiction }}</td>
            <td class="govuk-table__cell">{{ entity.taxJurisdictionOfIncorporation }}</td>
            <td class="govuk-table__cell">
              <GvButton @click="startEditEntity(index)" variant="secondary" class="mb-0!">Edit</GvButton>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table.govuk-table {
  .govuk-table__cell {
    @apply align-middle;
  }
}
</style>
