const http = require('http');
const WebSocket = require('ws');

const app = require('./app');

const greetingMessage = `
harvey.one websocket control server.

Connect to this server via WS protocol:
ws://[CURRENT_URL]/
`;

const server = http.createServer((req, res) => {
  res.end(greetingMessage);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', app);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('harvey-control-server listening on port '
    + server.address().port + '...');
});
