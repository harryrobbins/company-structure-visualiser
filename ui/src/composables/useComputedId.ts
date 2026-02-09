import { computed, type MaybeRefOrGetter, toValue } from 'vue'

let id = 0

export function createUid(prefix: string = '') {
  return `${prefix}${prefix ? '-' : ''}${(id++).toString(36)}`
}

export function useComputedId(propId: MaybeRefOrGetter<string | undefined>, prefix: string) {
  return computed(() => {
    const propIdValue = toValue(propId)
    return propIdValue ? propIdValue : createUid(prefix)
  })
}
