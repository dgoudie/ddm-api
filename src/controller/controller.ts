import {
  getBeerOrLiquorBrands,
  getMixedDrinkRecipesWithIngredients,
  markBeerOrLiquorAsInStock,
} from '../services/service';

import express from 'express';
import { parseAndConvertAllParams } from '../utils/parse-query-param';
import { ServiceError } from '@stan/service-error';
import { ObjectId } from 'bson';

export function init(app: express.Application) {
  app.get('/api/beers-and-liquors', (req, res, next) =>
    getBeerOrLiquorBrands()
      .then((items) => res.send(items))
      .catch((e) => next(e))
  );
  app.post(
    '/api/secure/beers-and-liquors/:id/mark-in-stock/:flag',
    (req, res, next) => {
      const { id, flag } = <{ id: string; flag: boolean }>(
        parseAndConvertAllParams(req.params)
      );
      if (typeof flag !== 'boolean') {
        next(
          new ServiceError(
            400,
            `:flag parameter must be a boolean ('true' or 'false')`
          )
        );
      } else {
        let objectId: ObjectId;
        try {
          objectId = new ObjectId(id);
        } catch (e) {
          next(new ServiceError(400, 'Invalid parameter :id'));
          return;
        }
        markBeerOrLiquorAsInStock(objectId, flag)
          .then(() => res.sendStatus(204))
          .catch(next);
      }
    }
  );
  app.get('/api/mixed-drinks', (req, res, next) =>
    getMixedDrinkRecipesWithIngredients()
      .then((items) => res.send(items))
      .catch(next)
  );
}
