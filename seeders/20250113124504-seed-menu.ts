'use strict';

import { v4 as uuidv4 } from 'uuid';
import { datamenu } from '../config/data/menu';
import { QueryInterface, Sequelize } from 'sequelize';
import Model from '../src/module/app/menu/menu.model';
import { repository as repoResource } from '../src/module/app/resource/resource.repository';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const menus = datamenu.menu();
  const childmenu = datamenu.childmenu();
  const resource = await repoResource.detail({ username: 'adminuser' }, '');

  for (let i in menus) {
    const menu = await Model.create({
      ...menus[i],
      menu_id: uuidv4(),
      created_by: resource?.getDataValue('resource_id'),
    });
    const builkInsert = childmenu
      ?.filter((r) => r?.parent_id == menus[i]?.id)
      ?.map((r) => {
        return {
          ...r,
          menu_id: uuidv4(),
          parent_id: menu?.dataValues?.menu_id,
          created_by: resource?.getDataValue('resource_id'),
        };
      });
    await Model.bulkCreate(builkInsert);
  }
};

export const down: Migration = async () => {
  await Model.destroy({ where: {}, truncate: true });
};
