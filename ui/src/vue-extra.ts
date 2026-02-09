import type { Ref, UnwrapRef } from 'vue'
// eslint-disable-next-line vue/prefer-import-from-vue
import type { IfAny } from '@vue/shared'

export type VueRef<T> = [T] extends [Ref]
  ? IfAny<T, Ref<T>, T>
  : Ref<UnwrapRef<T>, UnwrapRef<T> | T>
