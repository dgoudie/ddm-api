import { AUTH_TOKEN, cookieOptions } from 'controller';
import { generateTokenFromPassword, verifyToken } from 'services/token-service';
import {
  getBeerOrLiquorBrands,
  getMixedDrinkRecipesWithIngredients,
} from 'services/service';

import express from 'express';

export function init(app: express.Application) {
  app.get('/api/beers-and-liquors', (req, res) =>
    getBeerOrLiquorBrands()
      .then((items) => res.send(items))
      .catch((e) => res.status(500).send(e))
  );
  app.get('/api/mixed-drinks', (req, res) =>
    getMixedDrinkRecipesWithIngredients()
      .then((items) => res.send(items))
      .catch((e) => res.status(500).send(e))
  );
  app.get('/api/secure/beers-and-liquors/:id/mark-in-stock', (req, res) => {
    res.sendStatus(200);
  });
  app.get('/api/login', (req, res) => {
    try {
      const { token, expires } = generateTokenFromPassword(req.header('x-pw'));
      res.cookie(AUTH_TOKEN, token, {
        ...cookieOptions,
        expires: new Date(expires),
      });
      res.sendStatus(200);
    } catch (e) {
      res.sendStatus(422);
    }
  });
  app.get('/api/logout', (req, res) => {
    res.clearCookie(AUTH_TOKEN);
    res.sendStatus(200);
  });
  app.get('/api/verify-token', (req, res) => {
    const token = req.cookies[AUTH_TOKEN];
    const isValid = verifyToken(token);
    if (isValid) {
      res.sendStatus(200);
    } else {
      res.clearCookie(AUTH_TOKEN);
      res.sendStatus(401);
    }
  });
}
