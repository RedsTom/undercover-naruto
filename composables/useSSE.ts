export const useSSE = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  let eventSource: EventSource | null = null;
  let roomIdRef: string | null = null;

  function on(event: string, callback: (data: unknown) => void): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);
    return () => { listeners.get(event)?.delete(callback); };
  }

  function off(event: string, callback: (data: unknown) => void): void {
    listeners.get(event)?.delete(callback);
  }

  function connect(roomId: string): void {
    if (import.meta.server) return;
    disconnect();
    roomIdRef = roomId;

    const es = new EventSource(`/api/rooms/${roomId}/stream`);

    es.addEventListener('connected', (e: MessageEvent) => {
      try { dispatch('connected', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('room:updated', (e: MessageEvent) => {
      try { dispatch('room:updated', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('game:started', (e: MessageEvent) => {
      try { dispatch('game:started', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('game:playerVoted', (e: MessageEvent) => {
      try { dispatch('game:playerVoted', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('game:roundEnded', (e: MessageEvent) => {
      try { dispatch('game:roundEnded', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('game:continued', (e: MessageEvent) => {
      try { dispatch('game:continued', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('game:reset', (e: MessageEvent) => {
      try { dispatch('game:reset', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('phase:changed', (e: MessageEvent) => {
      try { dispatch('phase:changed', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('turn:changed', (e: MessageEvent) => {
      try { dispatch('turn:changed', JSON.parse(e.data)); } catch {}
    });

    es.addEventListener('player:kicked', (e: MessageEvent) => {
      try { dispatch('player:kicked', JSON.parse(e.data)); } catch {}
    });

    es.onerror = () => {};
    eventSource = es;
  }

  function dispatch(event: string, data: unknown): void {
    const cbs = listeners.get(event);
    if (cbs) cbs.forEach(cb => cb(data));
  }

  function disconnect(): void {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    roomIdRef = null;
  }

  return { connect, disconnect, on, off };
};
