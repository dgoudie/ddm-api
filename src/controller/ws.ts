import ws from 'express-ws';

let wsInstance: ws.Instance;

export const init = (app: ws.Application, instance: ws.Instance) => {
  wsInstance = instance;
  app.ws('/api', function (_ws, _req) {});
};

type UpdateMessage = {
  type: 'UPDATE';
  apiPath: string;
  timestamp: number;
};

type BroadcastMessage = UpdateMessage;

export const broadcastToWebsocketClients = (message: BroadcastMessage) => {
  wsInstance
    .getWss()
    .clients.forEach((client) => client.send(JSON.stringify(message)));
};
