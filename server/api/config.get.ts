export default defineEventHandler(() => {
  const discordClientId = process.env.DISCORD_CLIENT_ID || '';
  if (!discordClientId) {
    throw createError({ statusCode: 500, message: 'DISCORD_CLIENT_ID non défini' });
  }
  return { discordClientId };
});
