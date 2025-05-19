'use strict';

import { Sequelize } from 'sequelize';
import { helper } from '../helpers/helper';

let sequelize: Sequelize;

export async function initializeDatabase(config: any): Promise<Sequelize> {
  if (sequelize) return sequelize;

  sequelize = new Sequelize(
    config?.database,
    config?.username,
    config?.password,
    {
      host: config?.host,
      port: config?.port,
      dialect: config?.dialect,
      timezone: '+07:00',
      retry: {
        match: [/Deadlock/i],
        max: 3,
      },
      pool: {
        max: 30,
        min: 0,
        acquire: 60000,
        idle: 5000,
      },
      logging: config?.debug ? console.log : false,
    }
  );

  try {
    await sequelize.authenticate();
    console.warn('Connection has been established successfully.');
  } catch (err: any) {
    await helper.sendNotif(err?.message);
    console.warn('Unable to connect to the database:', err?.message);
  }

  return sequelize;
}

export { sequelize };
