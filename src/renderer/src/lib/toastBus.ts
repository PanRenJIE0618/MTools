type ToastListener = (message: string) => void

const listeners = new Set<ToastListener>()

export const toastBus = {
  show(message: string): void {
    for (const listener of listeners) {
      listener(message)
    }
  },
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}
