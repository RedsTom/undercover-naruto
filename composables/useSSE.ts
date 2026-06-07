export const useSSE = () => {
  const listeners = new Map<string, Set<(data: unknown) => void>>();
  let eventSource: EventSource | null = null;
  let roomIdRef: string | null = null;
  let playerIdRef: string | null = null;
  let pageHideHandler: (() => void) | null = null;
  let beforeUnloadHandler: (() => void) | null = null;
  let visibilityHandler: (() => void) | null = null;

  function on(event: string, callback: (data: unknown) => void): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);
    return () => { listeners.get(event)?.delete(callback); };
  }

  function off(event: string, callback: (data: unknown) => void): void {
    listeners.get(event)?.delete(callback);
  }

  function sendLeaveBeacon(roomId: string, pid: string): void {
    try {
      navigator.sendBeacon(`/api/rooms/${roomId}/leave`, JSON.stringify({ playerId: pid }));
    } catch {}
  }

  function connect(roomId: string, playerId?: string): void {
    if (import.meta.server) return;
    disconnect();
    roomIdRef = roomId;
    playerIdRef = playerId || null;

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
      pageHideHandler = () => {
        if (roomIdRef && playerIdRef) sendLeaveBeacon(roomIdRef, playerIdRef);
      };
      window.addEventListener('pagehide', pageHideHandler);

      beforeUnloadHandler = () => {
        if (roomIdRef && playerIdRef) sendLeaveBeacon(roomIdRef, playerIdRef);
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);

      visibilityHandler = () => {
        if (document.hidden) {
          disconnect();
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    }
  }

  function dispatch(event: string, data: unknown): void {
    const cbs = listeners.get(event);
    if (cbs) cbs.forEach(cb => cb(data));
  }

  function disconnect(): void {
    if (pageHideHandler) {
      window.removeEventListener('pagehide', pageHideHandler);
      pageHideHandler = null;
    }
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      beforeUnloadHandler = null;
    }
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    roomIdRef = null;
    playerIdRef = null;
  }

  return { connect, disconnect, on, off };
};