'use strict';

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import moment from 'moment';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import conn from '../config/database';
import { Op, QueryTypes } from 'sequelize';
import { Response } from 'express';
import { response } from '../helpers/response';
import Telegram, { Telegram_ParseModes } from 'tele-sender';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

interface mail {
  host: string;
  port: number;
  user: string;
  pass: string;
  sender: string;
  secure: boolean;
  debug: boolean;
}

dotenv.config();
const CHAT_ID_TELEGRAM: string = process.env.CHAT_ID_TELEGRAM || '';
const telegram = new Telegram(process.env.TOKEN_TELEGRAM || '');
const month: string = moment().format('YYYY-MM');
const configMail: mail = {
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: +(process.env.MAIL_PORT || 2525),
  user: process.env.MAIL_USERNAME || 'fce06934e4832d',
  pass: process.env.MAIL_PASSWORD || '27ceb283c382c4',
  sender: process.env.MAIL_SENDER || 'noreply@poc.mail.com',
  secure: process.env.MAIL_ENCRYPTION == 'ssl' ? true : false,
  debug: process.env.MAIL_DEBUG == 'false',
};

export default class Helper {
  public date() {
    return moment().locale('id').format('YYYY-MM-DD HH:mm:ss');
  }

  public dateForNumber() {
    return moment().locale('id').format('DDMMYYYY');
  }

  public dateAdd(num: number, type: any) {
    return moment().add(num, type).locale('id').format('YYYY-MM-DD HH:mm:ss');
  }

  public dateSubtract(num: number, type: any) {
    return moment()
      .subtract(num, type)
      .locale('id')
      .format('YYYY-MM-DD HH:mm:ss');
  }

  public only(keys: Array<string>, data: any, isUpdate: boolean = false) {
    const date = moment().locale('id').format('YYYY-MM-DD HH:mm:ss');
    let result: any = {};

    keys.forEach((i) => {
      if ((data[i] && data[i] !== undefined) || data[i] == 0) {
        result[i] = data[i];
      }
    });
    if (isUpdate) {
      result = {
        ...result,
        modified_date: date,
      };
    } else {
      result = {
        ...result,
        created_date: date,
      };
    }
    return result;
  }

  public async hashIt(password: string, length: number = 10) {
    const salt: string = await bcrypt.genSalt(length);
    const hashed: string = await bcrypt.hash(password, salt);
    return hashed;
  }

  public async compareIt(password: any, hashed: any) {
    return await bcrypt.compare(password, hashed);
  }

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public checkExtention(file: File, type: string = 'image') {
    if (type == 'image' && file?.size > 2048000)
      return 'file size maksimal *2MB.';
    const allowedExt: any = {
      image: ['jpg', 'jpeg', 'png', 'gif'],
      video: ['mp4', 'webm', 'avi', 'mkv', 'mov', 'flv', 'mts', 'wmv'],
      file: ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    };
    let ext: string = file?.name.split('.').pop() || '-';
    if (allowedExt[type].includes(ext.toLocaleLowerCase())) return 'allowed';
    return `file extension allowed *${allowedExt[type]?.join(', ')}.`;
  }

  public async upload(file: any, folder: string = '') {
    const upload_path: string = `./public/uploads/${folder}/${month}`;
    if (!fs.existsSync(upload_path)) {
      fs.mkdirSync(upload_path, { recursive: true });
    }
    const name: string = file?.name.replace(/ /g, '');
    let uploadPath: string = `${upload_path}/${name}`;
    await file.mv(uploadPath, function (err: any) {
      if (err) {
        telegram.send(
          CHAT_ID_TELEGRAM,
          err?.message,
          Telegram_ParseModes.MarkdownV2
        );
        return err?.message;
      }
    });
    return uploadPath.replace('./public', '');
  }

  public async resize(file: any, fd: string, w: number, h: number = 0) {
    const size: string = `${w}${h == 0 ? '' : '_' + h}`;
    const rename = `${
      file?.name.replace(/ /g, '').split('.')[0]
    }_${size}.${file?.name.split('.').pop()}`;
    const upload_path: string = `./public/uploads/${fd}/${month}`;
    let uploadPath: string = `${upload_path}/${rename}`;
    if (!fs.existsSync(upload_path)) {
      fs.mkdirSync(upload_path, { recursive: true });
    }

    let resize: any = null;
    if (['gallery'].includes(fd)) {
      const metadata = await sharp(path.resolve(file?.tempFilePath)).metadata();
      const width: number = +(metadata?.width || 0);
      const height: number = +(metadata?.height || 0);
      const newWidth: number = Math.round(width / (height / w));

      resize = await sharp(path.resolve(file?.tempFilePath))
        .resize(newWidth, w)
        .toFile(path.resolve(uploadPath));
    } else {
      resize = await sharp(path.resolve(file?.tempFilePath))
        .resize(w, h == 0 ? w : h)
        .toFile(path.resolve(uploadPath));
    }

    return {
      ...resize,
      filename: rename,
      path_doc: uploadPath.replace('./public', ''),
    };
  }

  public async sendNotif(message: string) {
    await telegram.send(
      CHAT_ID_TELEGRAM,
      message,
      Telegram_ParseModes.MarkdownV2
    );
  }

  public async catchError(message: string, code: number, res: Response) {
    const msg: string = `poc - ${message}`;
    await this.sendNotif(msg);
    return response.failed(msg, code, res);
  }

  public async sendEmail(data: Object | any) {
    let tls = {};
    if (configMail?.secure) {
      tls = {
        tls: {
          ciphers: 'SSLv3',
        },
      };
    }

    let mailOptions: any;
    if (data?.attachments && data?.attachments?.length > 0) {
      mailOptions = {
        from: configMail?.sender,
        to: data?.to,
        subject: data?.subject,
        html: data?.content,
        attachments: data?.attachments,
      };
    } else {
      mailOptions = {
        from: configMail?.sender,
        to: data?.to,
        subject: data?.subject,
        html: data?.content,
      };
    }

    const transporter = nodemailer.createTransport({
      host: configMail?.host,
      port: configMail?.port,
      secure: configMail?.secure,
      auth: {
        user: configMail?.user,
        pass: configMail?.pass,
      },
      logger: configMail?.debug,
      ...tls,
    });

    transporter.sendMail(mailOptions, async (error: any, info: any) => {
      if (error) {
        console.warn(`Email error: ${error}`);
        await telegram.send(
          CHAT_ID_TELEGRAM,
          error,
          Telegram_ParseModes.MarkdownV2
        );
      } else {
        console.warn(`Email sent: ${info?.response}`);
      }
    });
  }

  public slug(string: string) {
    return string
      .replace(/ /g, '-')
      .replace(/[^a-zA-Z0-9-]+/g, '')
      .toLowerCase();
  }

  public conditionArea(data: any) {
    let condition: object = {};
    if (data?.role_name == 'admin kota') {
      condition = {
        area_province_id: data?.province_id,
        area_regencies_id: data?.regency_id,
        role_id: { [Op.not]: 1 },
      };
    } else if (data?.role_name == 'admin provinsi')
      condition = {
        area_province_id: data?.province_id,
        role_id: { [Op.not]: 1 },
      };
    return condition;
  }

  public async updateUsia() {
    try {
      await conn.sequelize.query(
        `
          UPDATE app_resource SET usia = (
            SELECT timestampdiff(YEAR, ar.date_of_birth, curdate()) AS usia
            FROM app_resource ar
            WHERE ar.resource_id = app_resource.resource_id
          )
          WHERE date_of_birth IS NOT NULL AND date_of_birth < curdate()
        `,
        { type: QueryTypes.SELECT }
      );
      await this.sendNotif('success update usia');
    } catch (err: any) {
      await this.sendNotif(`gagal update usia: ${err?.message}`);
    }
  }

  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public isValidUUID(uuid: string) {
    return uuidValidate(uuid) && uuidVersion(uuid) == 4;
  }
}

export const helper = new Helper();
