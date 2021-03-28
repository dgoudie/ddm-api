import { overwriteProperties, properties } from 'resources/properties';

import { properties as devProperties } from 'resources/dev-properties';
import { getLogger } from 'log4js';
import { init as initController } from 'controller';
import { init as initRepository } from 'repository';
import { init as initServices } from 'services';
import { properties as prodProperties } from 'resources/prod-properties';

const init = () => {
  getLogger().level = `INFO`;

  const env = determineEnvironment();

  setupProperties(env);

  getLogger().info(`starting ${properties.serviceName} (env=${env})`);

  initRepository();
  initServices();
  initController();
};

const determineEnvironment = () => {
  const ENV_REGEX = /--env=/i;
  const env = process.argv.find((arg) => arg.match(ENV_REGEX)) || 'dev';
  return env.replace(ENV_REGEX, '');
};

const setupProperties = (env: string) => {
  switch (env) {
    case 'dev': {
      overwriteProperties(devProperties);
      break;
    }
    case 'prod': {
      overwriteProperties(prodProperties);
      break;
    }
  }
  return env;
};

init();
