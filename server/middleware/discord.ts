export default defineEventHandler(async (event) => {
  const host = getRequestHeader(event, 'host') || '';
  const url = getRequestURL(event);

  if (host.includes('discordsays.com') && url.pathname === '/') {
    return sendRedirect(event, '/discord');
  }
});
