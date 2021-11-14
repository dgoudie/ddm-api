import { configure, getLogger } from 'log4js';
import { overwriteProperties, properties } from './resources/properties';

import { properties as devProperties } from './resources/dev-properties';
import { init as initController } from './controller';
import { init as initRepository } from './repository';
import { init as initServices } from './services';
import { properties as prodProperties } from './resources/prod-properties';

const init = () => {
  getLogger().level = `INFO`;
  if (!process.env.LOG_HOST) {
    getLogger().warn(`environment variable LOG_HOST not found.`);
  } else {
    configure({
      appenders: {
        logstash: {
          type: '@log4js-node/logstash-http',
          url: process.env.LOG_HOST,
          application: properties.serviceName,
        },
      },
      categories: {
        default: { appenders: ['logstash'], level: 'INFO' },
      },
    });
  }

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
