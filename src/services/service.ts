import {
  BeerOrLiquorBrand,
  MixedDrinkRecipe,
  MixedDrinkRecipeWithIngredients,
} from '@dgoudie/ddm-types';
import {
  deleteBeerOrLiquor as deleteBeerOrLiquorFromRepository,
  deleteMixedDrink as deleteMixedDrinkFromRepository,
  getBeerOrLiquorBrand as getBeerOrLiquorBrandFromRepository,
  getBeerOrLiquorBrands as getBeerOrLiquorBrandsFromRepository,
  getMixedDrinkRecipe as getMixedDrinkRecipeFromRepository,
  getMixedDrinkRecipesWithIngredients as getMixedDrinkRecipesWithIngredientsFromRepository,
  markBeerOrLiquorAsInStock as markBeerOrLiquorAsInStockInRepository,
  saveBeerOrLiquor as saveBeerOrLiquorToRepository,
  saveMixedDrinkRecipe as saveMixedDrinkRecipeToRepository,
} from '../repository/ddm.repository';

import { ObjectId } from 'bson';
import { validateAndConvertObjectId } from '../utils/object-id';

export async function getBeerOrLiquorBrands(
  onlyShowInStock = false,
  onlyOutOfStock = false,
  filterText?: string
) {
  try {
    return getBeerOrLiquorBrandsFromRepository(
      onlyShowInStock,
      onlyOutOfStock,
      filterText
    );
  } catch (e) {
    throw new Error('Unable to query database.');
  }
}
export function getBeerOrLiquorBrand(id: string) {
  return getBeerOrLiquorBrandFromRepository(id);
}

export function markBeerOrLiquorAsInStock(id: string, flag: boolean) {
  return markBeerOrLiquorAsInStockInRepository(id, flag);
}

export function saveBeerOrLiquor(
  id: string | undefined,
  beerOrLiquor: BeerOrLiquorBrand & { _id: undefined }
) {
  return saveBeerOrLiquorToRepository(id, beerOrLiquor);
}

export async function deleteBeerOrLiquor(id: string) {
  await deleteBeerOrLiquorFromRepository(id);
}

export async function getMixedDrinkRecipe(id: string) {
  return getMixedDrinkRecipeFromRepository(id);
}

export async function getMixedDrinkRecipesWithIngredients(
  onlyShowItemsWithAllIngedientsInStock = false,
  filterText?: string
): Promise<MixedDrinkRecipeWithIngredients[]> {
  try {
    return getMixedDrinkRecipesWithIngredientsFromRepository(
      onlyShowItemsWithAllIngedientsInStock,
      filterText
    );
  } catch (e) {
    throw new Error('Unable to query database.');
  }
}

export function saveMixedDrinkRecipe(
  id: string | undefined,
  mixedDrink: MixedDrinkRecipe & { _id: undefined }
) {
  const objectIdCountMap = new Map<ObjectId, number>();
  mixedDrink?.requiredBeersOrLiquors?.forEach((liquor) =>
    objectIdCountMap.set(validateAndConvertObjectId(liquor._id), liquor.count)
  );
  mixedDrink = {
    ...mixedDrink,
    requiredBeersOrLiquors: Array.from(
      objectIdCountMap.entries()
    ).map(([_id, count]) => ({ _id, count })),
  };
  return saveMixedDrinkRecipeToRepository(id, mixedDrink);
}

export async function deleteMixedDrink(id: string) {
  await deleteMixedDrinkFromRepository(id);
}
