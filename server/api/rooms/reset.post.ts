export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomId, playerId: pid } = body;

  const result = resetGame(roomId, pid);

  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error });
  }

  return { success: true };
});