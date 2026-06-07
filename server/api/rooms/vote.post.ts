export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, voterId, targetId } = body;

  const room = getRoom(roomId);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = castVote(room, voterId, targetId);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(roomId, 'game:playerVoted', room.toPublic());

  if (result.roundEnded) {
    broadcastToRoom(roomId, result.wasTie ? 'game:continued' : 'game:roundEnded', room.toPublic());
  }

  return { success: true, roundEnded: result.roundEnded };
});