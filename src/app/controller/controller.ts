import {
  getBeerOrLiquorBrands,
  getMixedDrinkRecipesWithIngredients,
} from 'services/service';

import express from 'express';

export function init(app: express.Application) {
  app.get('/beers-and-liquors', (req, res, next) =>
    getBeerOrLiquorBrands()
      .then((items) => res.send(items))
      .catch((e) => res.send(e).status(500))
  );
  app.get('/mixed-drinks', (req, res, next) =>
    getMixedDrinkRecipesWithIngredients()
      .then((items) => res.send(items))
      .catch((e) => res.send(e).status(500))
  );
}