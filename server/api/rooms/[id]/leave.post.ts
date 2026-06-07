export default defineEventHandler(async (event) => {
  const { id } = event.context.params!;
  const body = await readBody(event);
  const { playerId } = body;

  if (!playerId) {
    throw createError({ statusCode: 400, message: 'Missing playerId' });
  }

  handlePlayerDisconnect(id as string, playerId);
  return { ok: true };
});