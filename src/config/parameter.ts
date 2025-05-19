'use strict';

import dotenv from 'dotenv';
import { APP_NAME, DEVELOPMENT, MYSQL } from '../utils/constant';

dotenv.config();

interface AppConfig {
  app: string;
  appEnv: string;
  port: number;
  assetType: string;
  baseDomain: string;
  baseUrlFe: string;
  database: DatabaseConfig;
  jwt: JWTConfig;
  mail: EmailConfig;
  telegram: TelegramConfig;
}

interface DatabaseConfig {
  dialect: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  debug: boolean;
}

interface JWTConfig {
  secret: string;
  expiresIn: number;
  secretRefresh: string;
  expiresInRefresh: number;
}

interface EmailConfig {
  service: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  sender: string;
  debug: boolean;
  secure: string;
}

interface TelegramConfig {
  token: string;
  chatId: string;
}

const localInitialize = () => {
  let dbConfg: DatabaseConfig = {
    dialect: process.env.DB_DIALECT || MYSQL,
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'local',
    username: process.env.DB_USER || 'username',
    password: process.env.DB_PASSWORD || '',
    debug: process.env.DB_DEBUG == 'true',
  };
  let jwtConfig: JWTConfig = {
    secret: process.env.JWT_TOKEN || 'token',
    expiresIn: +(process.env.JWT_TOKEN_EXPIRED || 3600),
    secretRefresh: process.env.JWT_REFRESH_TOKEN || 'refresh',
    expiresInRefresh: +(process.env.JWT_REFRESH_TOKEN_EXPIRED || 3600),
  };
  let emailConfig: EmailConfig = {
    service: process.env.MAIL_SERVICE || 'mail',
    host: process.env.MAIL_HOST || 'smtp',
    port: +(process.env.MAIL_PORT || 587),
    user: process.env.MAIL_USERNAME || 'username',
    pass: process.env.MAIL_PASSWORD || 'password',
    sender: process.env.MAIL_SENDER || 'no-reply@mail.com',
    debug: process.env.MAIL_DEBUG == 'true',
    secure: process.env.SECURE || '',
  };
  let telegramConfig: TelegramConfig = {
    token: process.env.TOKEN_TELEGRAM || 'token',
    chatId: process.env.CHAT_ID_TELEGRAM || 'chat_id',
  };

  let config: AppConfig = {
    app: process.env.APP || APP_NAME,
    appEnv: process.env.APP_ENV || DEVELOPMENT,
    port: +(process.env.PORT || 5000),
    assetType: process.env.ASSET_TYPE || 'local',
    baseDomain: process.env.BASE_DOMAIN || 'localhost',
    baseUrlFe: process.env.BASE_URL_FE || 'http://localhost:3000',
    database: dbConfg,
    jwt: jwtConfig,
    mail: emailConfig,
    telegram: telegramConfig,
  };
  return config;
};

class Config {
  static async initialize() {
    const APP_ENV: string = DEVELOPMENT;
    try {
      if (APP_ENV === DEVELOPMENT) {
        return localInitialize();
      }

      console.warn('Retrieve parameter store successfully.');
      return localInitialize();
    } catch (err: any) {
      console.warn('Failed to initialize:', err?.message);
    }
  }
}
export default Config;
