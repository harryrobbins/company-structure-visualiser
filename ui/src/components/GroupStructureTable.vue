<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GroupStructure, Entity, EntityRelationship } from '@/db/models'
import GvInput from '@/components/govuk/Input.vue'
import GvSelect from '@/components/govuk/Select.vue'
import GvButton from '@/components/govuk/Button.vue'

interface Props {
  structure: GroupStructure
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

const emit = defineEmits<{
  save: [structure: GroupStructure]
}>()

// Create local editable copies
const entities = ref<Entity[]>(JSON.parse(JSON.stringify(props.structure.entities)))
const relationships = ref<EntityRelationship[]>(JSON.parse(JSON.stringify(props.structure.relationships)))

const editingEntity = ref<number | null>(null)
const editingRelationship = ref<number | null>(null)

const entityTypes = ['Company', 'Company Hybrid', 'Partnership', 'Partnership Hybrid', 'Branch', 'Trust'] as const

function startEditEntity(index: number) {
  editingEntity.value = index
}

function cancelEditEntity() {
  editingEntity.value = null
}

function startEditRelationship(index: number) {
  editingRelationship.value = index
}

function cancelEditRelationship() {
  editingRelationship.value = null
}

function addEntity() {
  entities.value.push({
    id: '',
    type: 'Company',
    name: '',
    tin: '',
    taxJurisdiction: '',
    taxJurisdictionOfIncorporation: '',
  })
  editingEntity.value = entities.value.length - 1
}

function removeEntity(index: number) {
  entities.value.splice(index, 1)
  if (editingEntity.value === index) {
    editingEntity.value = null
  }
}

function addRelationship() {
  relationships.value.push({
    parent: '',
    child: '',
    percentageOwnership: 0,
  })
  editingRelationship.value = relationships.value.length - 1
}

function removeRelationship(index: number) {
  relationships.value.splice(index, 1)
  if (editingRelationship.value === index) {
    editingRelationship.value = null
  }
}

function saveChanges() {
  // Stub: Emit the changes
  emit('save', {
    entities: entities.value,
    relationships: relationships.value,
  })

  // For now, just log
  console.log('Saving changes (stubbed):', {
    entities: entities.value,
    relationships: relationships.value,
  })
}
</script>

<template>
  <div class="group-structure-table">
    <h2 class="govuk-heading-l">Entities</h2>

    <table class="govuk-table">
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header">Name</th>
          <th scope="col" class="govuk-table__header">TIN</th>
          <th scope="col" class="govuk-table__header">Type</th>
          <th scope="col" class="govuk-table__header">Tax Jurisdiction</th>
          <th scope="col" class="govuk-table__header">Incorporation Jurisdiction</th>
          <th scope="col" class="govuk-table__header" v-if="editable">Actions</th>
        </tr>
      </thead>
      <tbody class="govuk-table__body">
        <tr class="govuk-table__row" v-for="(entity, index) in entities" :key="index">
          <template v-if="editingEntity === index">
            <td class="govuk-table__cell">
              <GvInput v-model="entity.name" :id="`entity-name-${index}`" />
            </td>
            <td class="govuk-table__cell">
              <GvInput v-model="entity.tin" :id="`entity-tin-${index}`" />
            </td>
            <td class="govuk-table__cell">
              <GvSelect v-model="entity.type" :id="`entity-type-${index}`">
                <option v-for="type in entityTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </GvSelect>
            </td>
            <td class="govuk-table__cell">
              <GvInput v-model="entity.taxJurisdiction" :id="`entity-tax-jurisdiction-${index}`" />
            </td>
            <td class="govuk-table__cell">
              <GvInput v-model="entity.taxJurisdictionOfIncorporation" :id="`entity-incorporation-${index}`" />
            </td>
            <td class="govuk-table__cell" v-if="editable">
              <GvButton @click="cancelEditEntity" variant="secondary">Cancel</GvButton>
            </td>
          </template>
          <template v-else>
            <td class="govuk-table__cell">{{ entity.name }}</td>
            <td class="govuk-table__cell">{{ entity.tin }}</td>
            <td class="govuk-table__cell">{{ entity.type }}</td>
            <td class="govuk-table__cell">{{ entity.taxJurisdiction }}</td>
            <td class="govuk-table__cell">{{ entity.taxJurisdictionOfIncorporation }}</td>
            <td class="govuk-table__cell" v-if="editable">
              <GvButton @click="startEditEntity(index)" variant="secondary">Edit</GvButton>
              <GvButton @click="removeEntity(index)" variant="warning">Remove</GvButton>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <GvButton v-if="editable" @click="addEntity">Add Entity</GvButton>

    <h2 class="govuk-heading-l govuk-!-margin-top-6">Relationships</h2>

    <table class="govuk-table">
      <thead class="govuk-table__head">
        <tr class="govuk-table__row">
          <th scope="col" class="govuk-table__header">Parent</th>
          <th scope="col" class="govuk-table__header">Child</th>
          <th scope="col" class="govuk-table__header">Ownership %</th>
          <th scope="col" class="govuk-table__header" v-if="editable">Actions</th>
        </tr>
      </thead>
      <tbody class="govuk-table__body">
        <tr class="govuk-table__row" v-for="(relationship, index) in relationships" :key="index">
          <template v-if="editingRelationship === index">
            <td class="govuk-table__cell">
              <GvInput v-model="relationship.parent" :id="`relationship-parent-${index}`" />
            </td>
            <td class="govuk-table__cell">
              <GvInput v-model="relationship.child" :id="`relationship-child-${index}`" />
            </td>
            <td class="govuk-table__cell">
              <GvInput
                v-model.number="relationship.percentageOwnership"
                :id="`relationship-ownership-${index}`"
                type="number"
                min="0"
                max="100"
              />
            </td>
            <td class="govuk-table__cell" v-if="editable">
              <GvButton @click="cancelEditRelationship" variant="secondary">Cancel</GvButton>
            </td>
          </template>
          <template v-else>
            <td class="govuk-table__cell">{{ relationship.parent }}</td>
            <td class="govuk-table__cell">{{ relationship.child }}</td>
            <td class="govuk-table__cell">{{ relationship.percentageOwnership }}%</td>
            <td class="govuk-table__cell" v-if="editable">
              <GvButton @click="startEditRelationship(index)" variant="secondary">Edit</GvButton>
              <GvButton @click="removeRelationship(index)" variant="warning">Remove</GvButton>
            </td>
          </template>
        </tr>
      </tbody>
    </table>

    <GvButton v-if="editable" @click="addRelationship">Add Relationship</GvButton>

    <div class="govuk-button-group govuk-!-margin-top-6" v-if="editable">
      <GvButton @click="saveChanges">Save Changes</GvButton>
    </div>
  </div>
</template>

<style scoped>
.group-structure-table {
  margin-top: 2rem;
}

.govuk-table__cell .govuk-input,
.govuk-table__cell .govuk-select {
  margin-bottom: 0;
}

.govuk-button-group {
  display: flex;
  gap: 1rem;
}

.govuk-table__cell .govuk-button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
