export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    response.setHeader('Content-Security-Policy', "frame-ancestors https://*.discord.com https://*.discordsays.com");
  });
});
