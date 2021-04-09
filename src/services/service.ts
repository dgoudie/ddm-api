import {
  getBeerOrLiquorBrands as getBeerOrLiquorBrandsFromRepository,
  getMixedDrinkRecipesWithIngredients as getMixedDrinkRecipesWithIngredientsFromRepository,
  markBeerOrLiquorAsInStock as markBeerOrLiquorAsInStockInRepository,
} from '../repository/ddm.repository';

import { MixedDrinkRecipeWithIngredients } from '@dgoudie/ddm-types';
import { ObjectId } from 'bson';

export async function getBeerOrLiquorBrands(
  onlyShowInStock = false,
  filterText?: string
) {
  try {
    return getBeerOrLiquorBrandsFromRepository(onlyShowInStock, filterText);
  } catch (e) {
    throw new Error('Unable to query database.');
  }
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

export function markBeerOrLiquorAsInStock(id: ObjectId, flag: boolean) {
  return markBeerOrLiquorAsInStockInRepository(id, flag);
}
