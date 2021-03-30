import { getLogger } from 'log4js';

export function init() {
  getLogger().info(`initializing services...`);
  if (!process.env.JWT_SECRET) {
    getLogger().error(`environment variable JWT_SECRET not found.`);
  }
  if (!process.env.LOGIN_PASSWORD) {
    getLogger().error(`environment variable LOGIN_PASSWORD not found.`);
  }
}
