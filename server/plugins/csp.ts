export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    response.headers = response.headers || {};
    response.headers['Content-Security-Policy'] = "frame-ancestors https://*.discord.com https://*.discordsays.com";
  });
});
