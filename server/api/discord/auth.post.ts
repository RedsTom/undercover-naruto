const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export default defineEventHandler(async (event) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw createError({ statusCode: 500, message: 'Discord not configured' });
  }

  const body = await readBody(event);
  const { code, accessToken: clientAccessToken, channelId } = body;

  if (!channelId) {
    throw createError({ statusCode: 400, message: 'Missing channelId' });
  }

  let accessToken: string;

  if (code) {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `https://${DISCORD_CLIENT_ID}.discordsays.com/`,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw createError({ statusCode: 401, message: `Failed to exchange Discord code: ${text}` });
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;
  } else if (clientAccessToken) {
    accessToken = clientAccessToken;
  } else {
    throw createError({ statusCode: 400, message: 'Missing code or accessToken' });
  }

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    throw createError({ statusCode: 401, message: 'Failed to fetch Discord user' });
  }

  const discordUser = await userResponse.json();
  const username = discordUser.global_name || discordUser.username;

  const existingRoomId = getRoomByChannel(channelId);

  if (existingRoomId) {
    const existingRoom = getRoom(existingRoomId);
    if (existingRoom) {
      const result = joinRoom(existingRoom.code, username);
      if ('error' in result) {
        throw createError({ statusCode: 400, message: result.error });
      }
      broadcastToRoom(result.room.id, 'room:updated', result.room.toPublic());
      return {
        success: true,
        roomId: result.room.id,
        roomCode: result.room.code,
        playerId: result.player.id,
        room: result.room.toPublic(),
        user: { username },
      };
    }
    removeChannelMapping(channelId);
  }

  const result = createRoom(username);
  setRoomChannel(channelId, result.room.id);

  return {
    success: true,
    roomId: result.room.id,
    roomCode: result.room.code,
    playerId: result.player.id,
    room: result.room.toPublic(),
    user: { username },
  };
});
