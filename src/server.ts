'use strict';

import cors from 'cors';
import dotenv from 'dotenv';
import moment from 'moment';
import cron from 'node-cron';
import bodyParser from 'body-parser';
import express, { Express } from 'express';
import fileUpload from 'express-fileupload';
import { xss } from 'express-xss-sanitizer';

import routes from './routes';
import conn from './config/database';
import { helper } from './helpers/helper';
require('express-async-errors');

const app: Express = express();
const port: number = +(process.env.PORT || 5000);
const day: string = moment().format('YYYY-MM-DD');

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: `./tmp/${day}/`,
  })
);
app.use(xss());

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
app.use(cors(options));
app.use(routes);

(async () => {
  try {
    await conn.sequelize.authenticate();
    console.warn('Connection has been established successfully.');
  } catch (err: any) {
    await helper.sendNotif(err?.message);
    console.warn('Unable to connect to the database:', err?.message);
  }
})();

cron.schedule('1 0 * * *', async () => {
  await helper.updateUsia();
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running on port: ${port}`);
});
