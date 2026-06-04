import type { GameConfig } from '~/types';
import { useRoomAPI } from './useRoom';

export const useGameAPI = () => {
  const { room, playerId } = useRoomAPI();
  const myWord = useState<string | null>('myWord', () => null);
  const myRole = useState<string | null>('myRole', () => null);

  async function startGame(config?: Partial<GameConfig>): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/start', {
        method: 'POST',
        body: { roomId: room.value.id, playerId: playerId.value, config },
      });
      const data = res as any;

      if (data.success) {
        const meRes = await $fetch(`/api/rooms/${room.value.id}/me?playerId=${playerId.value}`);
        const meData = meRes as any;
        myWord.value = meData.myWord;
        myRole.value = meData.myRole;
      }

      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to start game' };
    }
  }

  async function vote(targetId: string): Promise<{ success: boolean; error?: string; roundEnded?: boolean }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/vote', {
        method: 'POST',
        body: { roomId: room.value.id, voterId: playerId.value, targetId },
      });
      const data = res as any;
      return { success: data.success, roundEnded: data.roundEnded };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to vote' };
    }
  }

  async function nextTurn(): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/turn/next', {
        method: 'POST',
        body: { roomId: room.value.id, playerId: playerId.value },
      });
      const data = res as any;
      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to advance turn' };
    }
  }

  async function startVoting(): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/start-vote', {
        method: 'POST',
        body: { roomId: room.value.id, playerId: playerId.value },
      });
      const data = res as any;
      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to start vote' };
    }
  }

  async function nextRound(): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/next', {
        method: 'POST',
        body: { roomId: room.value.id, playerId: playerId.value },
      });
      const data = res as any;

      if (data.success) {
        const meRes = await $fetch(`/api/rooms/${room.value.id}/me?playerId=${playerId.value}`);
        const meData = meRes as any;
        myWord.value = meData.myWord;
        myRole.value = meData.myRole;
      }

      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to advance' };
    }
  }

  async function fetchMyInfo(): Promise<void> {
    if (!room.value || !playerId.value) return;
    try {
      const data = await $fetch(`/api/rooms/${room.value.id}/me?playerId=${playerId.value}`) as any;
      myWord.value = data.myWord;
      myRole.value = data.myRole;
    } catch {}
  }

  async function returnToLobby(): Promise<{ success: boolean; error?: string }> {
    if (!room.value || !playerId.value) return { success: false, error: 'Not in a room' };

    try {
      const res = await $fetch('/api/rooms/reset', {
        method: 'POST',
        body: { roomId: room.value.id, playerId: playerId.value },
      });
      const data = res as any;
      return { success: data.success };
    } catch (e: any) {
      return { success: false, error: e.data?.message || 'Failed to return to lobby' };
    }
  }

  function cleanup(): void {
    myWord.value = null;
    myRole.value = null;
  }

  return { myWord, myRole, startGame, nextTurn, startVoting, vote, nextRound, returnToLobby, fetchMyInfo, cleanup };
};