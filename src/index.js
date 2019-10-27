const WebSocket = require('ws');

const ActionType = {
  MACHINE_CONNECT: 'MACHINE_CONNECT',
  CONTROLLER_CONNECT: 'CONTROLLER_CONNECT',
  MACHINE_OFFLINE: 'MACHINE_OFFLINE',
  MACHINE_ONLINE: 'MACHINE_ONLINE',
};

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const machines = [];
const controllers = [];

function sendMachineOnline(socket) {
  const action = { type: ActionType.MACHINE_ONLINE };
  socket.send(JSON.stringify(action));
}
function sendMachineOffline(socket) {
  const action = { type: ActionType.MACHINE_OFFLINE };
  socket.send(JSON.stringify(action));
}

wss.on('connection', function connection(ws, req) {
  const remotePort = req.connection.remotePort;
  console.log('client connected', remotePort);

  ws.on('message', function incoming(message) {
    const action = JSON.parse(message);
    switch (action.type) {
      case ActionType.MACHINE_CONNECT: {
        // if there is a machine already connected
        if (machines.length > 0) {
          console.log('REJECTED: unable to connect more than one machine.');
          const reaction = {
            type: 'MACHINE_REJECTED',
            error: 'Unable to connect more than one machine.',
          };
          ws.send(JSON.stringify(reaction));
          ws.close();
        } else {
          // pushing new machine's websocket into registry
          machines.push(ws);
          // notifying (possible) controller about machine online status
          const controller = controllers[0];
          if (controller) {
            sendMachineOnline(controller);
          }
          console.log('New machine connected on port', remotePort);
        }
        break;
      }
      case ActionType.CONTROLLER_CONNECT: {
        // if there is a controller already connected
        if (controllers.length > 0) {
          console.log('REJECTED: unable to connect more than one controller.');
          const reaction = {
            type: 'CONTROLLER_REJECTED',
            error: 'Unable to connect more than one controller.',
          };
          ws.send(JSON.stringify(reaction));
          ws.close();
        } else {
          // registering new contoller's websocket
          controllers.push(ws);
          // sending machine online status to the controller
          const machine = machines[0];
          if (machine) {
            // if there is a connected machine
            sendMachineOnline(ws);
          } else {
            // if there is no connected machine
            sendMachineOffline(ws);
          }
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
    if (machines.includes(ws)) {
      // removing machine websocket from registry
      machines.pop();
      // notifying controller about machine offline status
      const controller = controllers[0];
      if (controller) {
        sendMachineOffline(controller);
      }
      console.log(`Machine ${remotePort} disconnected with code ${code}`);
    } else if (controllers.includes(ws)) {
      // removing controller socket from registry
      controllers.pop();
      console.log(`Controller ${remotePort} disconnected with code ${code}`);
    } else{
      console.log(`Unknown client ${remotePort} disconnected with code ${code}`);
    }
  });

  /*const getRandomStatus = () => {
    if (Math.random() >= 0.5) {
      return 'MACHINE_ONLINE';
    }
    return 'MACHINE_OFFLINE';
  }
  const action = { type: getRandomStatus() };
  ws.send(JSON.stringify(action));*/
});

wss.on('listening', () => {
  console.log('harvey websocket sandbox server listening on port '
    + wss.address().port + '...');
});
