import {
  BeerOrLiquorBrand,
  MixedDrinkRecipeWithIngredients,
} from '@dgoudie/ddm-types';
import {
  deleteBeerOrLiquor as deleteBeerOrLiquorFromRepository,
  getBeerOrLiquorBrand as getBeerOrLiquorBrandFromRepository,
  getBeerOrLiquorBrands as getBeerOrLiquorBrandsFromRepository,
  getMixedDrinkRecipesWithIngredients as getMixedDrinkRecipesWithIngredientsFromRepository,
  markBeerOrLiquorAsInStock as markBeerOrLiquorAsInStockInRepository,
  saveBeerOrLiquor as saveBeerOrLiquorToRepository,
} from '../repository/ddm.repository';

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

export function saveBeerOrLiquor(
  id: string | undefined,
  beerOrLiquor: BeerOrLiquorBrand
) {
  return saveBeerOrLiquorToRepository(id, beerOrLiquor);
}

export async function deleteBeerOrLiquor(id: string) {
  await deleteBeerOrLiquorFromRepository(id);
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
