export function basePath(): string {
  return 'DYNAMIC_BASE_PATH' in window
    ? typeof window.DYNAMIC_BASE_PATH === 'string'
      ? window.DYNAMIC_BASE_PATH
      : __APP_CONFIG__.basePath
    : __APP_CONFIG__.basePath
}
