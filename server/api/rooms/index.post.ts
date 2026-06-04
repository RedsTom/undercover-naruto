export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { playerName } = body;

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 2) {
    throw createError({ statusCode: 400, message: 'Player name is required (min 2 characters)' });
  }

  const result = createRoom(playerName.trim());

  return {
    success: true,
    roomId: result.room.id,
    roomCode: result.room.code,
    playerId: result.player.id,
    room: result.room.toPublic(),
  };
});