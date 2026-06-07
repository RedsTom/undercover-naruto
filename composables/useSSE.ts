export const useSSE = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  let eventSource: EventSource | null = null;
  let roomIdRef: string | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  function on(event: string, callback: (data: unknown) => void): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);
    return () => { listeners.get(event)?.delete(callback); };
  }

  function off(event: string, callback: (data: unknown) => void): void {
    listeners.get(event)?.delete(callback);
  }

  function connect(roomId: string, playerId?: string): void {
    if (import.meta.server) return;
    disconnect();
    roomIdRef = roomId;

    const params = playerId ? `?playerId=${playerId}` : '';
    const es = new EventSource(`/api/rooms/${roomId}/stream${params}`);

    const events = ['room:updated', 'game:started', 'game:playerVoted', 'game:roundEnded',
      'game:continued', 'game:reset', 'phase:changed', 'turn:changed', 'player:kicked',
      'host:changed', 'room:closed'];

    for (const evt of events) {
      es.addEventListener(evt, (e: MessageEvent) => {
        try { dispatch(evt, JSON.parse(e.data)); } catch {}
      });
    }

    es.onerror = () => {};
    eventSource = es;

    if (playerId) {
      pingInterval = setInterval(() => {
        $fetch(`/api/rooms/${roomId}/ping`, {
          method: 'POST',
          body: { playerId },
        }).catch(() => {});
      }, 10000);
    }
  }

  function dispatch(event: string, data: unknown): void {
    const cbs = listeners.get(event);
    if (cbs) cbs.forEach(cb => cb(data));
  }

  function disconnect(): void {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    roomIdRef = null;
  }

  return { connect, disconnect, on, off };
};
