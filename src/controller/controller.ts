import {
  deleteBeerOrLiquor,
  getBeerOrLiquorBrand,
  getBeerOrLiquorBrands,
  getMixedDrinkRecipesWithIngredients,
  markBeerOrLiquorAsInStock,
  saveBeerOrLiquor,
} from '../services/service';

import express from 'express';
import { parseAndConvertAllParams } from '../utils/parse-query-param';
import { ServiceError } from '@dgoudie/service-error';
import { broadcastToWebsocketClients } from './ws';

export function init(app: express.Application) {
  app.get('/api/beers-and-liquors', (req, res, next) => {
    const { onlyInStock, onlyOutOfStock, filter } = <
      {
        onlyInStock: boolean | undefined;
        onlyOutOfStock: boolean | undefined;
        filter: string;
      }
    >parseAndConvertAllParams(req.query);
    if (
      typeof onlyInStock !== 'boolean' &&
      typeof onlyInStock !== 'undefined'
    ) {
      next(
        new ServiceError(400, `Invalid boolean value for param 'onlyInStock'`)
      );
    } else if (
      typeof onlyOutOfStock !== 'boolean' &&
      typeof onlyOutOfStock !== 'undefined'
    ) {
      next(
        new ServiceError(
          400,
          `Invalid boolean value for param 'onlyOutOfStock'`
        )
      );
    } else {
      getBeerOrLiquorBrands(onlyInStock, onlyOutOfStock, filter)
        .then((items) => res.send(items))
        .catch((e) => next(e));
    }
  });

  app.get('/api/beer-or-liquor/:id', (req, res, next) => {
    const { id } = <{ id: string }>parseAndConvertAllParams(req.params);

    if (typeof id !== 'string') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    getBeerOrLiquorBrand(id)
      .then((record) => res.send(record))
      .catch(next);
  });

  app.post(
    '/api/secure/beer-or-liquor/:id/mark-in-stock/:flag',
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
        return;
      }
      if (typeof id !== 'string') {
        next(new ServiceError(400, `:id parameter must be a string`));
        return;
      }
      markBeerOrLiquorAsInStock(id, flag)
        .then(() => res.sendStatus(204))
        .then(() => {
          broadcastToWebsocketClients({
            type: 'UPDATE',
            apiPath: `/beers-and-liquors`,
            timestamp: Date.now(),
          });
        })
        .catch(next);
    }
  );
  app.put('/api/secure/beer-or-liquor/:id?', (req, res, next) => {
    const { id } = <{ id?: string }>parseAndConvertAllParams(req.params);
    if (typeof id !== 'string' && typeof id !== 'undefined') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    saveBeerOrLiquor(id, req.body)
      .then((id) => res.status(200).send(id))
      .catch(next);
  });

  app.delete('/api/secure/beer-or-liquor/:id', (req, res, next) => {
    const { id } = <{ id: string }>parseAndConvertAllParams(req.params);
    if (typeof id !== 'string') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    deleteBeerOrLiquor(id)
      .then(() => res.sendStatus(204))
      .catch(next);
  });

  app.get('/api/mixed-drinks', (req, res, next) => {
    const { onlyInStock, filter } = <
      { onlyInStock: boolean | undefined; filter: string }
    >parseAndConvertAllParams(req.query);
    if (
      typeof onlyInStock !== 'boolean' &&
      typeof onlyInStock !== 'undefined'
    ) {
      next(
        new ServiceError(400, `Invalid boolean value for param 'onlyInStock'`)
      );
    } else {
      return getMixedDrinkRecipesWithIngredients(onlyInStock, filter)
        .then((items) => res.send(items))
        .catch(next);
    }
  });
}
