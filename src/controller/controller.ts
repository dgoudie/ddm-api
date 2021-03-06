import {
  deleteBeerOrLiquor,
  deleteMixedDrink,
  getBeerOrLiquorBrand,
  getBeerOrLiquorBrands,
  getBeerOrLiquorBrandsByType,
  getMixedDrinkRecipe,
  getMixedDrinkRecipesWithIngredients,
  markBeerOrLiquorAsInStock,
  saveBeerOrLiquor,
  saveMixedDrinkRecipe,
} from '../services/service';

import express from 'express';
import { parseAndConvertAllParams } from '../utils/parse-query-param';
import { ServiceError } from '@dgoudie/service-error';
import { broadcastUpdateToWebsocketClients } from './ws';

export function init(app: express.Application) {
  app.get('/api/beers-and-liquors', (req, res, next) => {
    const filter = req.query.filter as string;
    getBeerOrLiquorBrands(filter)
      .then((items) => res.send(items))
      .catch((e) => next(e));
  });
  app.get('/api/beers-and-liquors-by-type', (req, res, next) => {
    const { onlyInStock, onlyOutOfStock } = <
      {
        onlyInStock: boolean | undefined;
        onlyOutOfStock: boolean | undefined;
      }
    >parseAndConvertAllParams(req.query);
    const filter = req.query.filter as string;
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
      getBeerOrLiquorBrandsByType(onlyInStock, onlyOutOfStock, filter)
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
          broadcastUpdateToWebsocketClients(`/beers-and-liquors`);
          broadcastUpdateToWebsocketClients(`/beers-and-liquors-by-type`);
          broadcastUpdateToWebsocketClients(`/mixed-drinks`);
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
      .then(() => {
        broadcastUpdateToWebsocketClients(`/beers-and-liquors`);
        broadcastUpdateToWebsocketClients(`/beers-and-liquors-by-type`);
        broadcastUpdateToWebsocketClients(`/mixed-drinks`);
      })
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
      .then(() => {
        broadcastUpdateToWebsocketClients(`/beers-and-liquors`);
        broadcastUpdateToWebsocketClients(`/beers-and-liquors-by-type`);
        broadcastUpdateToWebsocketClients(`/mixed-drinks`);
      })
      .catch(next);
  });

  app.get('/api/mixed-drinks', (req, res, next) => {
    const { onlyInStock } = <{ onlyInStock: boolean | undefined }>(
      parseAndConvertAllParams(req.query)
    );
    const filter = req.query.filter as string;
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

  app.get('/api/mixed-drink/:id', (req, res, next) => {
    const { id } = <{ id: string }>parseAndConvertAllParams(req.params);

    if (typeof id !== 'string') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    getMixedDrinkRecipe(id)
      .then((record) => res.send(record))
      .catch(next);
  });
  app.put('/api/secure/mixed-drink/:id?', (req, res, next) => {
    const { id } = <{ id?: string }>parseAndConvertAllParams(req.params);
    if (typeof id !== 'string' && typeof id !== 'undefined') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    saveMixedDrinkRecipe(id, req.body)
      .then((id) => res.status(200).send(id))
      .then(() => {
        broadcastUpdateToWebsocketClients(`/mixed-drinks`);
      })
      .catch(next);
  });
  app.delete('/api/secure/mixed-drink/:id', (req, res, next) => {
    const { id } = <{ id: string }>parseAndConvertAllParams(req.params);
    if (typeof id !== 'string') {
      next(new ServiceError(400, `:id parameter must be a string`));
      return;
    }
    deleteMixedDrink(id)
      .then(() => res.sendStatus(204))
      .then(() => {
        broadcastUpdateToWebsocketClients(`/mixed-drinks`);
      })
      .catch(next);
  });
}
