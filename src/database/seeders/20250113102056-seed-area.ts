'use strict';

import { v4 as uuidv4 } from 'uuid';
import { dataarea } from '../data/area';
import Config from '../../config/parameter';
import { initializeDatabase } from '../connection';
import { QueryInterface, Sequelize } from 'sequelize';
import ModelRegency from '../../module/area/regencies.model';
import ModelProvince from '../../module/area/provinces.model';
import { initializeModels } from '../../module/models/models.index';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const dataConfig = await Config.initialize();
  const sequelize = await initializeDatabase(dataConfig?.database);
  initializeModels(sequelize);

  const provinces = dataarea.provinces();
  const regencies = dataarea.regencies();

  for (let i in provinces) {
    const check = await ModelProvince.findOne({
      where: { name: provinces[i]?.name },
    });
    if (check) {
      console.log(
        `⚠️ Province ${provinces[i]?.name} already exists, skipping...`
      );
    } else {
      const province = await ModelProvince.create({
        id: uuidv4(),
        name: provinces[i]?.name,
        created_by: '00000000-0000-0000-0000-000000000000',
      });

      const regency = regencies
        ?.filter((r) => r?.province_id == provinces[i]?.id)
        ?.map((r) => ({
          id: uuidv4(),
          area_province_id: province?.dataValues?.id,
          name: r?.name,
          created_by: '00000000-0000-0000-0000-000000000000',
        }));
      await ModelRegency.bulkCreate(regency);
    }
  }
};

export const down: Migration = async () => {
  const dataConfig = await Config.initialize();
  const sequelize = await initializeDatabase(dataConfig?.database);
  initializeModels(sequelize);
  await ModelProvince.destroy({ where: {}, truncate: true });
  await ModelRegency.destroy({ where: {}, truncate: true });
};
