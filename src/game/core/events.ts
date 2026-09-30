/** Émetteur d'événements typé minimal. */
export class Emitter<E extends Record<string, unknown>> {
  private handlers: { [K in keyof E]?: Set<(p: E[K]) => void> } = {}

  on<K extends keyof E>(type: K, fn: (p: E[K]) => void): () => void {
    const set = (this.handlers[type] ??= new Set())
    set.add(fn)
    return () => set.delete(fn)
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    this.handlers[type]?.forEach((fn) => fn(payload))
  }

  clear(): void {
    this.handlers = {}
  }
}
