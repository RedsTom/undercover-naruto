const channelRooms = new Map<string, string>();

export function getRoomByChannel(channelId: string): string | undefined {
  return channelRooms.get(channelId);
}

export function setRoomChannel(channelId: string, roomId: string): void {
  channelRooms.set(channelId, roomId);
}

export function removeChannelMapping(channelId: string): void {
  channelRooms.delete(channelId);
}

export function removeChannelByRoom(roomId: string): void {
  for (const [channelId, rid] of channelRooms) {
    if (rid === roomId) {
      channelRooms.delete(channelId);
      return;
    }
  }
}
