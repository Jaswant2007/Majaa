type Listener = (data: string) => void;

class RealtimeEventBus {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcast(event: string, payload: Record<string, unknown>) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch {
        // Listener might be closed
      }
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var eventBusGlobal: RealtimeEventBus | undefined;
}

export const realtimeBus = globalThis.eventBusGlobal ?? new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  globalThis.eventBusGlobal = realtimeBus;
}
