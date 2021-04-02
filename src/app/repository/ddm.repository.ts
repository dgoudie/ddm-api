import { Collection, MongoClient, ObjectId } from 'mongodb';
import { BeerOrLiquorBrand, MixedDrinkRecipe } from '@stan/ddm-types';

import { properties } from 'resources/properties';
import { isDefinedAndNotNull } from 'utils/defined-null';
import { getLogger } from 'log4js';
import { ServiceError } from '@stan/service-error';

let mongoClient: MongoClient;
let beerOrLiquorBrandsCollection: Collection<BeerOrLiquorBrand>;
let mixedDrinkRecipesCollection: Collection<MixedDrinkRecipe>;

export async function init() {
  mongoClient = new MongoClient(process.env.MONGODB_CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await mongoClient.connect();
  } catch (e) {
    getLogger().error(`Error connecting to database: ${(<Error>e).message}`);
  }
  beerOrLiquorBrandsCollection = mongoClient
    .db(properties.mongodbDbName)
    .collection<BeerOrLiquorBrand>(
      properties.mongodbBeerOrLiquorBrandsCollectionName
    );
  mixedDrinkRecipesCollection = mongoClient
    .db(properties.mongodbDbName)
    .collection<MixedDrinkRecipe>(
      properties.mongodbMixedDrinkRecipesCollectionName
    );
}

export function getBeerOrLiquorBrands(filterText?: string, inStock?: boolean) {
  let query = {};
  if (isDefinedAndNotNull(inStock)) {
    query = { ...query, inStock };
  }
  if (isDefinedAndNotNull(filterText)) {
    query = { ...query, ...buildQueryForText(filterText) };
  }
  return beerOrLiquorBrandsCollection.find(query).sort({ name: 1 }).toArray();
}

export async function markBeerOrLiquorAsInStock(
  _id: ObjectId,
  inStock: boolean
) {
  const result = await beerOrLiquorBrandsCollection.updateOne(
    { _id },
    { $set: { inStock } }
  );
  if (result.matchedCount === 0) {
    throw new ServiceError(400, `BeerOrLiquor with ID ${_id} not found`);
  }
}

export function getMixedDrinkRecipes(filterText?: string) {
  let query = {};
  if (isDefinedAndNotNull(filterText)) {
    query = { ...query, ...buildQueryForText(filterText) };
  }
  return mixedDrinkRecipesCollection.find(query).sort({ name: 1 }).toArray();
}

const buildQueryForText = (text: string) => {
  const tokenizedText = text.toLowerCase().replace(/\//g, '\\').split(' ');
  return tokenizedText.map((token) => ({
    $where: function () {
      return !!(<string>this.name)?.toLowerCase().includes(token);
    },
  }));
};
