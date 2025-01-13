'use strict';

import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { variable } from './resource.variable';
import { helper } from '../../../helpers/helper';
import { repository } from './resource.repository';
import { response } from '../../../helpers/response';
import { transformer } from './resource.transformer';

dotenv.config();
const date: string = helper.date();

export default class Controller {
  public async index(req: Request, res: Response) {
    try {
      const limit: any = req?.query?.perPage || 10;
      const offset: any = req?.query?.page || 1;
      const keyword: any = req?.query?.q;
      const conditionArea: object = helper.conditionArea(req?.user);
      const admin: string = req?.user?.role_name == 'administrator' ? '' : 'administrator';

      const { count, rows } = await repository.index(
        {
          limit: parseInt(limit),
          offset: parseInt(limit) * (parseInt(offset) - 1),
          keyword: keyword,
        },
        conditionArea,
        admin,
      );
      if (rows?.length < 1) return response.failed('Data not found', 404, res);
      return response.success(
        'Data resource',
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`resource index: ${err?.message}`, 500, res);
    }
  }

  public async check(req: Request, res: Response) {
    try {
      const username: string = req.params.username;
      const result: Object | any = await repository.detail({
        username: username,
      });
      if (result) return response.success('Data already used', null, res);
      return response.success('Data can used', null, res);
    } catch (err: any) {
      return helper.catchError(`resource check: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id)) return response.failed(`id ${id} is not valid`, 400, res);

      const admin: string = req?.user?.role_name == 'administrator' ? '' : 'administrator';
      const result: Object | any = await repository.detail({ resource_id: id }, admin);
      if (!result) return response.failed('Data not found', 404, res);
      const getUser: Object = await transformer.detail(result);
      return response.success('Data resource', getUser, res);
    } catch (err: any) {
      return helper.catchError(`resource detail: ${err?.message}`, 500, res);
    }
  }

  public async create(req: Request, res: Response) {
    let confirm_hash: string = '';
    let message: string = '';

    try {
      const checkEmail = await repository.check({
        email: { [Op.like]: `%${req?.body?.email}%` },
      });
      if (checkEmail) return response.failed('Data already exists', 400, res);
      if (!req?.body?.password)
        return response.failed('Password is required', 422, res);

      let username: string = req?.body?.email.split('@')[0];
      const checkUsername = await repository.check({
        username: username,
      });
      if (checkUsername) username = username + helper.random(100, 999);

      let role_id: any = null;
      let image_foto: any = null;
      let regency_id: any = null;
      let province_id: any = null;
      if (req?.body?.role_id) role_id = JSON.parse(req?.body?.role_id);
      if (req?.body?.regency_id) regency_id = JSON.parse(req?.body?.regency_id);
      if (req?.body?.province_id)
        province_id = JSON.parse(req?.body?.province_id);
      if (req?.files && req?.files.image_foto) {
        let checkFile = helper.checkExtention(req?.files?.image_foto);
        if (checkFile != 'allowed') return response.failed(checkFile, 422, res);

        image_foto = await helper.upload(req?.files.image_foto, 'resource');
      }

      confirm_hash = await helper.hashIt(username, 6);
      const password: string = await helper.hashIt(req?.body?.password);
      const only: Object = helper.only(variable.fillable(), req?.body);

      const resource = await repository.create({
        payload: {
          ...only,
          username: username,
          password: password,
          confirm_hash: confirm_hash,
          image_foto: image_foto,
          role_id: role_id?.value || null,
          province_id: province_id?.value || null,
          regency_id: regency_id?.value || null,
          created_by: req?.user?.id || null,
        },
      });

      message = 'Data success saved';
    } catch (err: any) {
      return helper.catchError(`resource create: ${err?.message}`, 500, res);
    }

    try {
      await helper.sendEmail({
        to: req?.body?.email,
        subject: 'Welcome to POC',
        content: `
          <h3>Hi ${req?.body?.full_name},</h3>
          <p>Congratulation to join as a member, below this link to activation your account:</p>
          ${process.env.BASE_URL_FE}/account-verification?confirm_hash=${confirm_hash}
        `,
      });
    } catch (err: any) {
      message = `<br /> error send email: ${err?.message}`;
    }

    return response.success(message, null, res);
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id)) return response.failed(`id ${id} is not valid`, 400, res);

      const admin: string = req?.user?.role_name == 'administrator' ? '' : 'administrator';
      const check = await repository.check({ resource_id: id }, admin);
      if (!check) return response.failed('Data not found', 404, res);

      let role_id: any = null;
      let province_id: any = null;
      let regency_id: any = null;
      let image_foto: any = null;
      if (req?.body?.role_id) role_id = JSON.parse(req?.body?.role_id);
      if (req?.body?.province_id)
        province_id = JSON.parse(req?.body?.province_id);
      if (req?.body?.regency_id) regency_id = JSON.parse(req?.body?.regency_id);
      if (req?.files && req?.files.image_foto) {
        let checkFile = helper.checkExtention(req?.files?.image_foto);
        if (checkFile != 'allowed') return response.failed(checkFile, 422, res);

        image_foto = await helper.upload(req?.files.image_foto, 'resource');
      }

      let password: any = null;
      if (req?.body?.password) {
        const isMatch: boolean = await helper.compareIt(
          req?.body?.password,
          check?.getDataValue('password')
        );
        if (!isMatch) {
          password = await helper.hashIt(req?.body?.password);
        } else {
          return response.failed('Password does not same old', 500, res);
        }
      }

      const data: any = helper.only(variable.fillable(), req?.body, true);
      delete data?.username;
      await repository.update({
        payload: {
          ...data,
          password: password || check?.getDataValue('password'),
          role_id: role_id?.value || check?.getDataValue('role_id'),
          area_province_id:
            province_id?.value || check?.getDataValue('area_province_id'),
          area_regencies_id:
            regency_id?.value || check?.getDataValue('area_regencies_id'),
          image_foto: image_foto || check?.getDataValue('image_foto'),
          modified_by: req?.user?.id,
        },
        condition: { resource_id: id },
      });

      return response.success('Data success updated', null, res);
    } catch (err: any) {
      return helper.catchError(`resource update: ${err?.message}`, 500, res);
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req.params.id || '';
      if (!helper.isValidUUID(id)) return response.failed(`id ${id} is not valid`, 400, res);

      const admin: string = req?.user?.role_name == 'administrator' ? '' : 'administrator';
      const check = await repository.detail({ resource_uuid: id }, admin);
      if (!check) return response.failed('Data not found', 404, res);
      await repository.update({
        payload: {
          status: 'D',
          modified_by: req?.user?.id,
          modified_date: date,
        },
        condition: { resource_uuid: id },
      });
      return response.success('Data success deleted', null, res);
    } catch (err: any) {
      return helper.catchError(`resource delete: ${err?.message}`, 500, res);
    }
  }
}
export const resource = new Controller();
