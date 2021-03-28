import {
  BeerOrLiquorBrand,
  MixedDrinkRecipe,
  MixedDrinkRecipeWithIngredients,
} from '@stan/ddm-types';
import {
  getBeerOrLiquorBrands as getBeerOrLiquorBrandsFromRepository,
  getMixedDrinkRecipes as getMixedDrinkRecipesFromRepository,
} from 'repository/ddm.repository';

export async function getBeerOrLiquorBrands(filterText?: string) {
  try {
    return getBeerOrLiquorBrandsFromRepository(filterText);
  } catch (e) {
    throw new Error('Unable to query database.');
  }
}
export async function getMixedDrinkRecipesWithIngredients(
  filterText?: string
): Promise<MixedDrinkRecipeWithIngredients[]> {
  try {
    return Promise.all([
      getBeerOrLiquorBrandsFromRepository(),
      getMixedDrinkRecipesFromRepository(filterText),
    ]).then(async ([beerOrLiquorBrands, mixedDrinkRecipes]) => {
      const beerOrLiquorMap = beerOrLiquorBrands.reduce(
        (map, brand) => map.set(brand._id.toString(), brand),
        new Map<string, BeerOrLiquorBrand>()
      );
      return mixedDrinkRecipes.map((mdr) => {
        const requiredBeersOrLiquors = mdr.requiredBeerOrLiquorIds.map((id) => {
          return beerOrLiquorMap.get(id.toString());
        });
        const mdrWithIngredients: MixedDrinkRecipeWithIngredients = {
          ...mdr,
          requiredBeersOrLiquors,
        };
        return mdrWithIngredients;
      });
    });
  } catch (e) {
    throw new Error('Unable to query database.');
  }
}
