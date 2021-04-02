import { getLogger } from 'log4js';
import { init as initMeRepository } from '../repository/ddm.repository';

export function init() {
  getLogger().info(`initializing repository...`);
  if (!process.env.MONGODB_CONNECTION_URL) {
    getLogger().error(`environment variable MONGODB_CONNECTION_URL not found.`);
  }
  initMeRepository();
}
