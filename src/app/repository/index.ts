import { getLogger } from 'log4js';
import { init as initMeRepository } from 'repository/ddm.repository';

export function init() {
  getLogger().info(`initializing repository...`);
  initMeRepository();
}
