const WebSocket = require('ws');

const app = require('./app');

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

wss.on('connection', app);

wss.on('listening', () => {
  console.log('harvey websocket sandbox server listening on port '
    + wss.address().port + '...');
});
