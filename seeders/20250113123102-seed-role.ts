'use strict';

import { v4 as uuidv4 } from 'uuid';
import { QueryInterface, Sequelize } from 'sequelize';
import Model from '../src/module/app/role/role.model';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  await Model.bulkCreate([
    {
      role_id: uuidv4(),
      role_name: 'administrator',
      status: 1,
      restrict_level_area: 0,
      created_by: '00000000-0000-0000-0000-000000000000',
    },
    {
      role_id: uuidv4(),
      role_name: 'admin pusat',
      status: 1,
      restrict_level_area: 1,
      created_by: '00000000-0000-0000-0000-000000000000',
    },
    {
      role_id: uuidv4(),
      role_name: 'admin provinsi',
      status: 1,
      restrict_level_area: 2,
      created_by: '00000000-0000-0000-0000-000000000000',
    },
    {
      role_id: uuidv4(),
      role_name: 'admin kota',
      status: 1,
      restrict_level_area: 3,
      created_by: '00000000-0000-0000-0000-000000000000',
    },
    {
      role_id: uuidv4(),
      role_name: 'public',
      status: 1,
      restrict_level_area: 0,
      created_by: '00000000-0000-0000-0000-000000000000',
    },
  ]);
};

export const down: Migration = async () => {
  await Model.destroy({ where: {}, truncate: true });
};
