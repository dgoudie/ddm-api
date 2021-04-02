export let properties = {
  serviceName: process.env.npm_package_name,
  serviceShortName: process.env.npm_package_name!.replace(/-v[0-9]+/, ''),
  serviceVersion: process.env.npm_package_name!.replace(/.+-(v[0-9]+)/, '$1'),
  serviceDescription: process.env.npm_package_description,
  serverPort: 8080,
  mongodbDbName: 'DDM',
  mongodbBeerOrLiquorBrandsCollectionName: 'BEER_LIQUOR_BRANDS',
  mongodbMixedDrinkRecipesCollectionName: 'MIXED_DRINK_RECIPES',
};

export function overwriteProperties(newProperties: any) {
  properties = { ...properties, ...newProperties };
}
