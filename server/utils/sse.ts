const sseStreams = new Map<string, Set<{ push: (data: string) => void }>>();

export function addSSEStream(roomId: string, stream: { push: (data: string) => void }): void {
  if (!sseStreams.has(roomId)) sseStreams.set(roomId, new Set());
  sseStreams.get(roomId)!.add(stream);
}

export function removeSSEStream(roomId: string, stream: { push: (data: string) => void }): void {
  sseStreams.get(roomId)?.delete(stream);
}

export function broadcastToRoom(roomId: string, event: string, data: any): void {
  const streams = sseStreams.get(roomId);
  if (!streams) return;
  for (const stream of streams) {
    try { stream.push(JSON.stringify({ event, data })); } catch {}
  }
}
