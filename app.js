const { createServer } = require('node:http');
const next = require('next');

const port = Number(process.env.PORT || 3000);
const app = next({ dev: false, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((request, response) => {
      handle(request, response);
    }).listen(port);
  })
  .catch((error) => {
    console.error('Failed to start the Next.js application:', error);
    process.exit(1);
  });
