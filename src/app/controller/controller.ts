import {
  getBeerOrLiquorBrands,
  getMixedDrinkRecipesWithIngredients,
} from 'services/service';

import express from 'express';
import { generateTokenFromPassword } from 'services/token-service';

export function init(app: express.Application) {
  app.get('/api/beers-and-liquors', (req, res, next) =>
    getBeerOrLiquorBrands()
      .then((items) => res.send(items))
      .catch((e) => res.status(500).send(e))
  );
  app.get('/api/mixed-drinks', (req, res, next) =>
    getMixedDrinkRecipesWithIngredients()
      .then((items) => res.send(items))
      .catch((e) => res.status(500).send(e))
  );
  app.get(
    '/api/secure/beers-and-liquors/:id/mark-in-stock',
    (req, res, next) => {
      res.sendStatus(200);
    }
  );
  app.get('/api/token', (req, res, next) => {
    try {
      const token = generateTokenFromPassword(req.header('x-pw'));
      res.send(token);
    } catch (e) {
      res.sendStatus(422);
    }
  });
}
