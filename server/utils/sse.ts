const sseStreams = new Map<string, Map<string, { push: (data: string | { event?: string; data?: string }) => void }>>();

export function addSSEStream(roomId: string, playerId: string, stream: { push: (data: string | { event?: string; data?: string }) => void }): void {
  if (!sseStreams.has(roomId)) sseStreams.set(roomId, new Map());
  sseStreams.get(roomId)!.set(playerId, stream);
}

export function getSSEPlayerIds(roomId: string): string[] {
  return Array.from(sseStreams.get(roomId)?.keys() ?? []);
}

export function removeSSEStream(roomId: string, stream: { push: (data: string | { event?: string; data?: string }) => void }): string | null {
  const room = sseStreams.get(roomId);
  if (!room) return null;
  for (const [playerId, s] of room) {
    if (s === stream) {
      room.delete(playerId);
      if (room.size === 0) sseStreams.delete(roomId);
      return playerId;
    }
  }
  return null;
}

export function broadcastToRoom(roomId: string, event: string, data: any): void {
  const room = sseStreams.get(roomId);
  if (!room) return;
  for (const stream of room.values()) {
    try {
      const result = stream.push({ event, data: JSON.stringify(data) });
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch {}
  }
}
