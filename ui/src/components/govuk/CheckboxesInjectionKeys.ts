import type { InjectionKey, Ref } from 'vue'

export const CheckboxesModelValueInjectionKey: InjectionKey<Ref<any[]>> =
  Symbol('CheckboxesModelValue')

export const CheckboxesUpdateModelValueFunctionInjectionKey: InjectionKey<Function> = Symbol(
  'CheckboxesUpdateModelValueFunction',
)

export const CheckboxesNameInjectionKey: InjectionKey<Ref<string>> = Symbol('CheckboxesName')
