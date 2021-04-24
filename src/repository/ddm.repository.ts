import { Collection, MongoClient, ObjectId } from 'mongodb';
import {
  BeerOrLiquorBrand,
  MixedDrinkRecipe,
  MixedDrinkRecipeWithIngredients,
} from '@dgoudie/ddm-types';

import { properties } from '../resources/properties';
import { getLogger } from 'log4js';
import { ServiceError } from '@dgoudie/service-error';
import { translateMongodbException } from '../utils/translate-mongodb-exception';
import { validateAndConvertObjectId } from '../utils/object-id';

let mongoClient: MongoClient;
let beerOrLiquorBrandsCollection: Collection<BeerOrLiquorBrand>;
let mixedDrinkRecipesCollection: Collection<MixedDrinkRecipe>;

export async function init() {
  if (!process.env.MONGODB_CONNECTION_URL) {
    return;
  }
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

export function getBeerOrLiquorBrands(
  onlyShowInStock: boolean,
  onlyOutOfStock: boolean,
  filterText?: string
) {
  let pipeline: object[] = [];
  if (onlyShowInStock) {
    pipeline = [...pipeline, { $match: { inStock: true } }];
  }
  if (onlyOutOfStock) {
    pipeline = [...pipeline, { $match: { inStock: false } }];
  }
  if (!!filterText) {
    pipeline = [
      ...pipeline,
      {
        $match: { $expr: buildOrQueryForText(filterText, '$nameNormalized') },
      },
    ];
  }
  return beerOrLiquorBrandsCollection
    .aggregate(pipeline)
    .sort({ nameNormalized: 1 })
    .toArray();
}

export async function getBeerOrLiquorBrand(id: string) {
  let _id = validateAndConvertObjectId(id);
  const record = await beerOrLiquorBrandsCollection
    .findOne({ _id })
    .catch(translateMongodbException());
  if (!record) {
    throw new ServiceError(404, `BeerOrLiquor with ID ${_id} not found`);
  }
  return record;
}

export async function markBeerOrLiquorAsInStock(id: string, inStock: boolean) {
  let _id = validateAndConvertObjectId(id);
  const result = await beerOrLiquorBrandsCollection
    .updateOne({ _id }, { $set: { inStock } })
    .catch(translateMongodbException());
  if (result.matchedCount === 0) {
    throw new ServiceError(400, `BeerOrLiquor with ID ${_id} not found`);
  }
}

export async function saveBeerOrLiquor(
  id: string | undefined,
  beerOrLiquor: BeerOrLiquorBrand & { _id: undefined }
) {
  if (!!id) {
    let _id = validateAndConvertObjectId(id);
    const result = await beerOrLiquorBrandsCollection
      .updateOne({ _id }, { $set: { ...beerOrLiquor } })
      .catch(translateMongodbException());
    if (result.matchedCount === 0) {
      throw new ServiceError(400, `BeerOrLiquor with ID ${_id} not found`);
    }
    return id;
  } else {
    const result = await beerOrLiquorBrandsCollection
      .insertOne(beerOrLiquor)
      .catch(translateMongodbException());
    return result.insertedId.toHexString();
  }
}

export async function deleteBeerOrLiquor(id: string) {
  let _id = validateAndConvertObjectId(id);
  await mixedDrinkRecipesCollection
    .deleteMany({
      'requiredBeersOrLiquors._id': _id,
    })
    .catch(translateMongodbException());
  await beerOrLiquorBrandsCollection
    .deleteOne({ _id })
    .catch(translateMongodbException());
}

export async function getMixedDrinkRecipe(id: string) {
  let _id = validateAndConvertObjectId(id);
  const record = await mixedDrinkRecipesCollection
    .findOne({ _id })
    .catch(translateMongodbException());
  if (!record) {
    throw new ServiceError(404, `MixedDrink with ID ${_id} not found`);
  }
  return record;
}

export function getMixedDrinkRecipesWithIngredients(
  onlyShowItemsWithAllIngedientsInStock: boolean,
  filterText?: string
) {
  let pipeline: object[] = [
    {
      $lookup: {
        from: properties.mongodbBeerOrLiquorBrandsCollectionName,
        localField: 'requiredBeersOrLiquors._id',
        foreignField: '_id',
        as: 'requiredBeersOrLiquorsWithDetail',
      },
    },
    {
      $addFields: {
        requiredBeersOrLiquors: {
          $map: {
            input: '$requiredBeersOrLiquorsWithDetail',
            as: 'r',
            in: {
              _id: '$$r._id',
              name: '$$r.name',
              nameNormalized: '$$r.nameNormalized',
              additionalNotes: '$$r.additionalNotes',
              inStock: '$$r.inStock',
              price: '$$r.price',
              count: {
                $arrayElemAt: [
                  '$requiredBeersOrLiquors.count',
                  {
                    $indexOfArray: ['$requiredBeersOrLiquors._id', '$$r._id'],
                  },
                ],
              },
            },
          },
        },
      },
    },
  ];
  if (!!onlyShowItemsWithAllIngedientsInStock) {
    pipeline = [
      ...pipeline,
      {
        $match: {
          requiredBeersOrLiquors: {
            $not: {
              $elemMatch: {
                inStock: false,
              },
            },
          },
        },
      },
    ];
  }
  pipeline = [
    ...pipeline,
    {
      $addFields: {
        requiredBeersOrLiquors: {
          $map: {
            input: '$requiredBeersOrLiquors',
            as: 'row',
            in: {
              _id: '$$row._id',
              name: '$$row.name',
              inStock: '$$row.inStock',
              price: '$$row.price',
              count: '$$row.count',
              nameNormalized: '$$row.nameNormalized',
              additionalNotes: '$$row.additionalNotes',
              calculatedPrice: {
                $multiply: ['$$row.price', '$$row.count'],
              },
            },
          },
        },
      },
    },
  ];
  if (!!filterText) {
    pipeline = [
      ...pipeline,
      {
        $addFields: {
          requiredBeersOrLiquors: {
            $map: {
              input: '$requiredBeersOrLiquors',
              as: 'row',
              in: {
                _id: '$$row._id',
                name: '$$row.name',
                inStock: '$$row.inStock',
                price: '$$row.price',
                count: '$$row.count',
                nameNormalized: '$$row.nameNormalized',
                additionalNotes: '$$row.additionalNotes',
                calculatedPrice: '$$row.calculatedPrice',
                nameMatch: buildOrQueryForText(
                  filterText,
                  '$$row.nameNormalized'
                ),
              },
            },
          },
        },
      },
    ];
  }
  pipeline = [
    ...pipeline,
    {
      $addFields: {
        price: {
          $divide: [
            {
              $round: {
                $multiply: [
                  { $sum: '$requiredBeersOrLiquors.calculatedPrice' },
                  2,
                ],
              },
            },
            2,
          ],
        },
      },
    },
  ];
  if (!!filterText) {
    pipeline = [
      ...pipeline,
      {
        $match: {
          $or: [
            {
              $expr: buildOrQueryForText(filterText, '$nameNormalized'),
            },
            {
              requiredBeersOrLiquors: {
                $elemMatch: {
                  nameMatch: true,
                },
              },
            },
          ],
        },
      },
    ];
  }
  pipeline = [
    ...pipeline,
    {
      $unset: [
        'requiredBeersOrLiquors.calculatedPrice',
        'requiredBeersOrLiquors.nameMatch',
        'requiredBeersOrLiquorsWithDetail',
      ],
    },
  ];

  return mixedDrinkRecipesCollection
    .aggregate<MixedDrinkRecipeWithIngredients>(pipeline)
    .sort({ nameNormalized: 1 })
    .toArray()
    .catch(translateMongodbException());
}

export async function saveMixedDrinkRecipe(
  id: string | undefined,
  mixedDrink: MixedDrinkRecipe & { _id: undefined }
) {
  if (!!id) {
    let _id = validateAndConvertObjectId(id);
    const requiredBeersOrLiquors = mixedDrink?.requiredBeersOrLiquors?.map(
      (drink) => ({
        ...drink,
        _id: validateAndConvertObjectId((drink._id as unknown) as string),
      })
    );
    const result = await mixedDrinkRecipesCollection
      .updateOne({ _id }, { $set: { ...mixedDrink, requiredBeersOrLiquors } })
      .catch(translateMongodbException());
    if (result.matchedCount === 0) {
      throw new ServiceError(400, `BeerOrLiquor with ID ${_id} not found`);
    }
    return id;
  } else {
    const result = await mixedDrinkRecipesCollection
      .insertOne(mixedDrink)
      .catch(translateMongodbException());
    return result.insertedId.toHexString();
  }
}

export async function deleteMixedDrink(id: string) {
  let _id = validateAndConvertObjectId(id);
  await mixedDrinkRecipesCollection
    .deleteOne({ _id })
    .catch(translateMongodbException());
}

const buildOrQueryForText = (
  text: string,
  argName: string
): { $or: { $function: any }[] } => {
  const tokenizedText = text.toLowerCase().replace(/\//g, '\\').split(' ');
  return {
    $or: tokenizedText.map<{ $function: any }>((token) => ({
      $function: {
        body: `function(text) { return text.includes("${token}")}`,
        args: [argName],
        lang: 'js',
      },
    })),
  };
};
