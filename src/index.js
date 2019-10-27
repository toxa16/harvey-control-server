const WebSocket = require('ws');

const ActionType = {
  MACHINE_CONNECT: 'MACHINE_CONNECT',
  CONTROLLER_CONNECT: 'CONTROLLER_CONNECT',
};

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const machines = [];
const controllers = [];

wss.on('connection', function connection(ws, req) {
  const remotePort = req.connection.remotePort;
  console.log('client connected', remotePort);

  ws.on('message', function incoming(message) {
    const action = JSON.parse(message);
    switch (action.type) {
      case ActionType.MACHINE_CONNECT: {
        if (machines.length > 0) {
          console.log('REJECTED: unable to connect more than one machine.');
          const reaction = {
            type: 'MACHINE_REJECTED',
            error: 'Unable to connect more than one machine.',
          };
          ws.send(JSON.stringify(reaction));
          ws.close();
        } else {
          machines.push(remotePort);
          console.log('New machine connected on port', remotePort);
        }
        break;
      }
      case ActionType.CONTROLLER_CONNECT: {
        if (controllers.length > 0) {
          console.log('REJECTED: unable to connect more than one controller.');
          const reaction = {
            type: 'CONTROLLER_REJECTED',
            error: 'Unable to connect more than one controller.',
          };
          ws.send(JSON.stringify(reaction));
          ws.close();
        } else {
          controllers.push(remotePort);
          console.log('New controller connected on port', remotePort);
        }
        break;
      }
      default: {
        console.log('Unknown action:', action);
        const reaction = { type: 'UNKNOWN_ACTION' };
        ws.send(JSON.stringify(reaction));
      }
    }
  });

  ws.on('close', (code, reason) => {
    if (machines.includes(remotePort)) {
      machines.pop();
      console.log(`Machine ${remotePort} disconnected with code ${code}`);
    } else if (controllers.includes(remotePort)) {
      controllers.pop();
      console.log(`Controller ${remotePort} disconnected with code ${code}`);
    } else{
      console.log(`Unknown client ${remotePort} disconnected with code ${code}`);
    }
  });

  const getRandomStatus = () => {
    if (Math.random() >= 0.5) {
      return 'MACHINE_ONLINE';
    }
    return 'MACHINE_OFFLINE';
  }
  const action = { type: getRandomStatus() };
  ws.send(JSON.stringify(action));
});

wss.on('listening', () => {
  console.log('harvey websocket sandbox server listening on port '
    + wss.address().port + '...');
});
