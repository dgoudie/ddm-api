import { Collection, MongoClient, ObjectId } from 'mongodb';
import {
  BeerOrLiquorBrand,
  MixedDrinkRecipe,
  MixedDrinkRecipeWithIngredients,
} from '@dgoudie/ddm-types';

import { properties } from '../resources/properties';
import { isDefinedAndNotNull } from '../utils/defined-null';
import { getLogger } from 'log4js';
import { ServiceError } from '@dgoudie/service-error';

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
  filterText?: string
) {
  let pipeline: object[] = [];
  if (onlyShowInStock) {
    pipeline = [...pipeline, { $match: { inStock: true } }];
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
    .sort({ name: 1 })
    .toArray();
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
    query = { ...query, ...buildOrQueryForText(filterText!, 'name') };
  }
  return mixedDrinkRecipesCollection.find(query).sort({ name: 1 }).toArray();
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
          $ceil: {
            $sum: '$requiredBeersOrLiquors.calculatedPrice',
          },
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
    .toArray();
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
