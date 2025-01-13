'use strict';

import { v4 as uuidv4 } from 'uuid';
import { Op, QueryInterface, Sequelize } from 'sequelize';
import Model from '../src/module/app/role.menu/role.menu.model';
import { repository as repoRole } from '../src/module/app/role/role.respository';
import { repository as repoMenu } from '../src/module/app/menu/menu.respository';
import { repository as repoResource } from '../src/module/app/resource/resource.repository';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const menus = await repoMenu.list();
  const role = await repoRole.detail({
    role_name: { [Op.like]: '%administrator%' },
  });
  const resource = await repoResource.detail({ username: 'adminuser' }, '');

  let bulkInsert: Array<Object> = [];
  for (let i in menus) {
    bulkInsert.push({
      role_menu_id: uuidv4(),
      role_id: role?.getDataValue('role_id'),
      menu_id: menus[i]?.menu_id,
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
