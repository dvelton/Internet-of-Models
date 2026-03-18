// Mock for @github/spark/hooks
// useKV is imported but unused in this app; stub it out for compatibility

export function useKV<T>(_key: string, _defaultValue?: T) {
  return [_defaultValue, () => {}] as const;
}
