export const useSSE = () => {
  let eventSource: EventSource | null = null;
  let roomIdRef: string | null = null;

  function connect(roomId: string): void {
    if (import.meta.server) return;
    disconnect();
    roomIdRef = roomId;

    eventSource = new EventSource(`/api/rooms/${roomId}/stream`);

    eventSource.onmessage = (e) => {
      console.log('[SSE] Message:', e.data);
    };

    eventSource.onerror = () => {
      console.log('[SSE] Connection error, will reconnect...');
    };
  }

  function disconnect(): void {
    eventSource?.close();
    eventSource = null;
    roomIdRef = null;
  }

  return { connect, disconnect };
};