'use strict';

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

interface Config {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  debug: boolean;
}

const cfg: Config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: +(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'dbpoc',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  debug: process.env.DB_DEBUG == 'true',
};

const conn: any = {};
const sequelize = new Sequelize(cfg?.database, cfg?.username, cfg?.password, {
  host: cfg?.host,
  port: cfg?.port,
  dialect: 'mysql',
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
  logging: cfg?.debug ? console.log : false,
});

conn.sequelize = sequelize;
conn.Sequelize = Sequelize;

export default conn;
