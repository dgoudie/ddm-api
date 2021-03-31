import express, { CookieOptions } from 'express';
import {
  generateNewTokenIfNecessary,
  verifyToken,
} from 'services/token-service';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getLogger } from 'log4js';
import { init as initController } from 'controller/controller';
import { properties } from 'resources/properties';

export const AUTH_TOKEN = 'AUTH_TOKEN';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
};

export function init() {
  getLogger().info(`initializing controller...`);
  if (!process.env.JWT_SECRET) {
    getLogger().error(`environment variable USER_INTERFACE_PATH not found.`);
  }
  const app = express();
  setupPreRequestMiddleware(app);
  setupHealthCheck(app);
  initController(app);
  app.listen(properties.serverPort, () =>
    getLogger().info(`listening on ${properties.serverPort}`)
  );
}
function setupPreRequestMiddleware(app: express.Application) {
  app.use(cors({ credentials: true, origin: process.env.USER_INTERFACE_PATH }));
  app.use(cookieParser());
  app.use('*/secure*', (req, res, next) => {
    const token = req.cookies[AUTH_TOKEN];
    const valid = verifyToken(token);
    if (valid) {
      next();
    } else {
      res.sendStatus(403);
    }
  });
  app.use((req, res, next) => {
    const token = req.cookies[AUTH_TOKEN];
    const newTokenWithExpiration = generateNewTokenIfNecessary(token);
    if (newTokenWithExpiration) {
      res.cookie(AUTH_TOKEN, newTokenWithExpiration.token, {
        ...cookieOptions,
        expires: new Date(newTokenWithExpiration.expires),
      });
    }
    next();
  });
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
