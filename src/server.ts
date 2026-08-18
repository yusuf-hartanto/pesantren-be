'use strict';

process.env.TZ = 'Asia/Jakarta';

import cors from 'cors';
import moment from 'moment';
import cron from 'node-cron';
import bodyParser from 'body-parser';
import express, { Express } from 'express';
import fileUpload from 'express-fileupload';
import { xss } from 'express-xss-sanitizer';

import routes from './routes';
import Config from './config/parameter';
import { helper } from './helpers/helper';
import 'express-async-errors';

import { runWithUser } from './context/userContext';
import { initializeJWT } from './config/config.jwt';
import { initializeApp } from './config/config.app';
import { initializeMail } from './config/config.mail';
import { initializeDatabase } from './database/connection';
import { initializeTelegram } from './config/config.telegram';
import { initializeModels } from './module/models/models.index';
import { TIMEZONE } from './utils/constant';

async function bootstrap() {
  const dataConfig = await Config.initialize();

  initializeApp(dataConfig);
  initializeJWT(dataConfig?.jwt);
  initializeMail(dataConfig?.mail);
  initializeTelegram(dataConfig?.telegram);

  const sequelize = await initializeDatabase(dataConfig?.database);
  initializeModels(sequelize);

  const app: Express = express();
  const day: string = moment().tz(TIMEZONE).format('YYYY-MM-DD');
  const options: cors.CorsOptions = {
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'X-Access-Token',
      'Authorization',
    ],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: '*',
    preflightContinue: false,
  };
  app.use(
    bodyParser.json({
      limit: '5mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: `/tmp/${day}/`,
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  );

  app.use(express.static('public'));
  app.use(
    xss({
      allowedKeys: ['penghasilan', 'url'],
    })
  );
  app.use(cors(options));
  app.use((req, res, next) => {
    runWithUser(null, next);
  });
  app.use(routes);

  cron.schedule(
    '0 * * * *',
    async () => {
      await helper.updateSesiGuru();
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  cron.schedule(
    '* * * * *',
    async () => {
      await helper.reminderInspeksi();
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  cron.schedule(
    '0 1 * * *',
    async () => {
      await helper.deleteOldActivityLogs();
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  cron.schedule(
    '30 0 * * *',
    async () => {
      await helper.updateStatusKesehatanSantri();
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  app.listen(dataConfig?.port, () => {
    console.log(`⚡️[server]: Server is running on port: ${dataConfig?.port}`);
  });
}

bootstrap();
