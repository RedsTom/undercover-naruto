export default defineEventHandler(async (event) => {
  const { id } = event.context.params!;

  const room = getRoom(id as string);
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' });
  }

  const result = resolveVoting(room);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  broadcastToRoom(id as string, 'room:updated', room.toPublic());

  if (result.roundEnded) {
    broadcastToRoom(id as string, result.wasTie ? 'game:continued' : 'game:roundEnded', room.toPublic());
  }

  return { success: true, wasTie: result.wasTie };
});