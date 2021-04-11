import {
  getBeerOrLiquorBrand as getBeerOrLiquorBrandFromRepository,
  getBeerOrLiquorBrands as getBeerOrLiquorBrandsFromRepository,
  getMixedDrinkRecipesWithIngredients as getMixedDrinkRecipesWithIngredientsFromRepository,
  markBeerOrLiquorAsInStock as markBeerOrLiquorAsInStockInRepository,
} from '../repository/ddm.repository';

import { MixedDrinkRecipeWithIngredients } from '@dgoudie/ddm-types';

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
export function getBeerOrLiquorBrand(id: string) {
  return getBeerOrLiquorBrandFromRepository(id);
}

export function markBeerOrLiquorAsInStock(id: string, flag: boolean) {
  return markBeerOrLiquorAsInStockInRepository(id, flag);
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
