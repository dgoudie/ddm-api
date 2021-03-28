import cors from 'cors';
import express from 'express';
import { getLogger } from 'log4js';
import { init as initController } from 'controller/controller';
import { properties } from 'resources/properties';

export function init() {
  getLogger().info(`initializing controller...`);
  const app = express();
  setupPreRequestMiddleware(app);
  setupHealthCheck(app);
  initController(app);
  app.listen(properties.serverPort, () =>
    getLogger().info(`listening on ${properties.serverPort}`)
  );
}
function setupPreRequestMiddleware(app: express.Application) {
  app.use(cors());
  app.use((req, res, next) => {
    if (!req.url.match(/^\/docs\/?/)) {
      getLogger().info(`Received request to ${req.url}`);
    }
    next();
  });
}
function setupHealthCheck(app: express.Application) {
  app.get('/healthcheck', (_req, res) => {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
    };
    try {
      res.send(healthcheck);
    } catch (e) {
      healthcheck.message = e;
      res.status(503).send(healthcheck);
    }
  });
}
