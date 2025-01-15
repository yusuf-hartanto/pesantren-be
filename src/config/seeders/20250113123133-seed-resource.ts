'use strict';

import { v4 as uuidv4 } from 'uuid';
import { helper } from '../../helpers/helper';
import { Op, QueryInterface, Sequelize } from 'sequelize';
import Model from '../../module/app/resource/resource.model';
import { repository as repoArea } from '../../module/area/area.repository';
import { repository as repoRole } from '../../module/app/role/role.respository';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const password = await helper.hashIt('adminuser');
  const role = await repoRole.detail({
    role_name: { [Op.like]: '%administrator%' },
  });
  const province = await repoArea.provinceDetail({
    name: { [Op.like]: '%JAWA BARAT%' },
  });
  const regency = await repoArea.regencyDetail({
    name: { [Op.like]: '%KABUPATEN BANDUNG%' },
  });
  await Model.bulkCreate([
    {
      resource_id: uuidv4(),
      role_id: role?.getDataValue('role_id'),
      username: 'adminuser',
      email: 'admin@mail.com',
      password: password,
      full_name: 'Super Admin',
      place_of_birth: 'Bandung',
      date_of_birth: helper.date(),
      usia: 1,
      telepon: '085722800025',
      status: 'A',
      area_province_id: province?.getDataValue('id'),
      area_regencies_id: regency?.getDataValue('id'),
      created_by: '00000000-0000-0000-0000-000000000000',
    },
  ]);
};

export const down: Migration = async () => {
  await Model.destroy({ where: {}, truncate: true });
};
