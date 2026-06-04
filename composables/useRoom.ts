import type { RoomState } from '~/types';

export const useRoomAPI = () => {
  const room = useState<RoomState | null>('room', () => null);
  const playerId = useState<string | null>('playerId', () => null);
  const playerName = useState<string>('playerName', () => '');
  const isHost = computed(() => room.value?.hostId === playerId.value);
  const playerCount = computed(() => room.value?.playerCount ?? 0);

  async function createRoom(name: string): Promise<{ success: boolean; roomCode?: string; error?: string }> {
    try {
      const res = await $fetch('/api/rooms', {
        method: 'POST',
        body: { playerName: name },
      });
      const data = res as any;
      if (data.success) {
        playerId.value = data.playerId;
        playerName.value = name;
        room.value = data.room;
        return { success: true, roomCode: data.roomCode };
      }
      return { success: false, error: 'Failed to create room' };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to create room' };
    }
  }

  async function joinRoom(code: string, name: string): Promise<{ success: boolean; roomCode?: string; error?: string }> {
    try {
      const res = await $fetch('/api/rooms/join', {
        method: 'POST',
        body: { roomCode: code, playerName: name },
      });
      const data = res as any;
      if (data.success) {
        playerId.value = data.playerId;
        playerName.value = name;
        room.value = data.room;
        return { success: true, roomCode: data.roomCode };
      }
      return { success: false, error: 'Failed to join room' };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to join room' };
    }
  }

  async function fetchRoom(roomId: string): Promise<void> {
    try {
      const data = await $fetch<RoomState>(`/api/rooms/${roomId}`);
      room.value = data;
    } catch {}
  }

  function setRoom(roomData: RoomState, pid: string): void {
    room.value = roomData;
    playerId.value = pid;
  }

  function cleanup(): void {
    room.value = null;
    playerId.value = null;
    playerName.value = '';
  }

  async function kickPlayer(targetId: string): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/kick', {
        method: 'POST',
        body: { roomId: room.value.id, hostId: playerId.value, targetId },
      });
      const data = res as any;
      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to kick player' };
    }
  }

  return { room, playerId, playerName, isHost, playerCount, createRoom, joinRoom, fetchRoom, setRoom, cleanup, kickPlayer };
};