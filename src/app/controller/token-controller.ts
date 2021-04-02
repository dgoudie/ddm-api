import { AUTH_TOKEN, cookieOptions } from 'controller';
import { generateTokenFromPassword, verifyToken } from 'services/token-service';

import { ServiceError } from '@stan/service-error';
import express from 'express';

export function init(app: express.Application) {
  app.get('/api/login', (req, res, next) => {
    try {
      const { token, expires } = generateTokenFromPassword(req.header('x-pw'));
      res.cookie(AUTH_TOKEN, token, {
        ...cookieOptions,
        expires: new Date(expires),
      });
      res.sendStatus(200);
    } catch (e) {
      next(new ServiceError(422, 'Incorrect Password'));
    }
  });
  app.get('/api/logout', (req, res) => {
    res.clearCookie(AUTH_TOKEN);
    res.sendStatus(200);
  });
  app.get('/api/verify-token', (req, res, next) => {
    const token = req.cookies[AUTH_TOKEN];
    const isValid = verifyToken(token);
    if (isValid) {
      res.sendStatus(200);
    } else {
      res.clearCookie(AUTH_TOKEN);
      next(new ServiceError(422, 'Invalid Session Token'));
    }
  });
}
