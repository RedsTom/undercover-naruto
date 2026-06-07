process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

export default function () {}
