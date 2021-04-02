import { overwriteProperties, properties } from './resources/properties';

import { properties as devProperties } from './resources/dev-properties';
import { getLogger } from 'log4js';
import { init as initController } from './controller';
import { init as initRepository } from './repository';
import { init as initServices } from './services';
import { properties as prodProperties } from './resources/prod-properties';

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
  return process.env.NODE_ENV ?? 'development';
};

const setupProperties = (env: string) => {
  switch (env) {
    case 'development': {
      overwriteProperties(devProperties);
      break;
    }
    case 'production': {
      overwriteProperties(prodProperties);
      break;
    }
  }
  return env;
};

init();
