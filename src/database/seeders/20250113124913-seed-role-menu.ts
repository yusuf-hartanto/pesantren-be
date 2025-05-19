'use strict';

import { v4 as uuidv4 } from 'uuid';
import Config from '../../config/parameter';
import { ROLE_ADMIN } from '../../utils/constant';
import { initializeDatabase } from '../connection';
import { Op, QueryInterface, Sequelize } from 'sequelize';
import Model from '../../module/app/role.menu/role.menu.model';
import { initializeModels } from '../../module/models/models.index';
import { repository as repoRole } from '../../module/app/role/role.repository';
import { repository as repoMenu } from '../../module/app/menu/menu.repository';
import { repository as repoResource } from '../../module/app/resource/resource.repository';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const dataConfig = await Config.initialize();
  const sequelize = await initializeDatabase(dataConfig?.database);
  initializeModels(sequelize);

  const menus = await repoMenu.list();
  const role = await repoRole.detail({
    role_name: { [Op.like]: `%${ROLE_ADMIN}%` },
  });
  const resource = await repoResource.detail({ username: 'adminuser' }, '');

  let bulkInsert = [];
  for (let i in menus) {
    bulkInsert.push({
      role_menu_id: uuidv4(),
      role_id: role?.getDataValue('role_id'),
      menu_id: menus[i]?.menu_id,
      view: 1,
      create: 1,
      edit: 1,
      delete: 1,
      approve: 1,
      status: 1,
      created_by: resource?.getDataValue('resource_id'),
    });
  }
  await Model.bulkCreate(bulkInsert);
};

export const down: Migration = async () => {
  await Model.destroy({ where: {}, truncate: true });
};
