'use strict';

import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { helper } from '../../helpers/helper';
import { response } from '../../helpers/response';
import { helperauth } from '../../helpers/auth.helper';
import { variable } from '../app/resource/resource.variable';
import { repository } from '../app/resource/resource.repository';
import { transformer } from '../app/resource/resource.transformer';
import { repository as repoRole } from '../app/role/role.respository';

dotenv.config();
const date: string = helper.date();

export default class Controller {
  public async login(req: Request, res: Response) {
    const user = req?.user;
    const isMatch = await helper.compareIt(req?.body?.password, user?.password);
    if (isMatch) {
      const role = user?.getDataValue('role');
      const payload: Object = {
        id: user?.getDataValue('resource_id'),
        username: user?.getDataValue('username'),
        province_id: user?.getDataValue('area_province_id'),
        regency_id: user?.getDataValue('area_regencies_id'),
        role_name: role?.getDataValue('role_name'),
      };

      try {
        const token: string = helperauth.token(payload);
        const refresh: string = helperauth.refresh(payload);
        const getUser: Object = await transformer.detail(user);
        const totalLogin: Number = user?.total_login + 1;

        await repository.update({
          payload: {
            token: token,
            total_login: totalLogin,
          },
          condition: { resource_id: user?.resource_id },
        });

        const data: Object = {
          userdata: {
            ...getUser,
            total_login: totalLogin,
          },
          access_token: token,
          refresh_token: refresh,
        };
        return response.success('Login success', data, res);
      } catch (err: any) {
        return helper.catchError(`login: ${err?.message}`, 500, res);
      }
    } else {
      return response.failed('Password incorrect', 400, res);
    }
  }

  public async refresh(req: Request, res: Response) {
    const result = await repository.detail({
      resource_id: req?.user?.id,
    });
    if (!result) return response.failed('User not found', 404, res);

    const payload = {
      id: result?.getDataValue('resource_id'),
      username: result?.getDataValue('username'),
      province_id: result?.getDataValue('area_province_id'),
      regency_id: result?.getDataValue('area_regencies_id'),
      role_name: result?.getDataValue('role')?.role_name,
    };

    try {
      const refresh: string = helperauth.token(payload);
      const data: Object = {
        userdata: await transformer.detail(result),
        access_token: refresh,
        refresh_token: req?.body?.refresh_token,
      };
      response.success('New access token', data, res);
    } catch (err: any) {
      return helper.catchError(`refresh: ${err?.message}`, 500, res);
    }
  }

  public async register(req: Request, res: Response) {
    let confirm_hash: string = '';
    let message: string = '';

    try {
      const checkEmail = await repository.check({
        email: { [Op.like]: `%${req?.body?.email}%` },
      });
      if (checkEmail) return response.failed('Data already exists', 400, res);

      let username: string = req?.body?.email.split('@')[0];
      const checkUsername = await repository.check({
        username: username,
      });
      if (checkUsername) username = username + helper.random(100, 999);

      confirm_hash = await helper.hashIt(username, 6);
      const password: string = await helper.hashIt(req?.body?.password);
      const only: Object = helper.only(variable.fillable(), req?.body);

      const role = await repoRole.detail({
        role_name: { [Op.like]: '%public%' },
      });

      const { province_id, regency_id, tema_id } = req?.body;
      await repository.create({
        payload: {
          ...only,
          username: username,
          password: password,
          confirm_hash: confirm_hash,
          area_province_id: province_id?.value || null,
          area_regencies_id: regency_id?.value || null,
          role_id: role?.getDataValue('role_id') || null,
          created_by: req?.user?.id || null,
        },
      });

      message = 'success register';
    } catch (err: any) {
      return helper.catchError(`register: ${err?.message}`, 500, res);
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

  public async verify(req: Request, res: Response) {
    if (!req?.query?.confirm_hash)
      return response.failed('Confirm has is required', 422, res);

    try {
      const result = await repository.detail({
        confirm_hash: req?.query?.confirm_hash,
      });
      if (!result) return response.failed('Data not found', 404, res);

      if (result?.getDataValue('status') === 'A')
        return response.failed('Account has been verified', 400, res);

      await repository.update({
        payload: { status: 'A' },
        condition: { confirm_hash: req?.query?.confirm_hash },
      });

      return response.success('Account verified', null, res);
    } catch (err: any) {
      return helper.catchError(`verify: ${err?.message}`, 500, res);
    }
  }

  public async forgot(req: Request, res: Response) {
    try {
      const { email } = req?.body;
      if (!email) return response.failed('Email is required', 422, res);

      const result = await repository.detail({
        email: email,
      });
      if (!result) return response.failed('Data not found', 404, res);

      const confirm_hash = await helper.hashIt(email, 6);
      await repository.update({
        payload: {
          confirm_hash: confirm_hash,
          modified_date: date,
        },
        condition: { email: email },
      });

      await helper.sendEmail({
        to: email,
        subject: 'Reset Password',
        content: `
          <h3>Hi ${result?.getDataValue('full_name')},</h3>
          <p>Below this link to reset password your account:</p>
          ${process.env.BASE_URL_FE}/reset-password?confirm_hash=${confirm_hash}
        `,
      });

      return response.success('success forgot password', null, res);
    } catch (err: any) {
      return helper.catchError(`forgot: ${err?.message}`, 500, res);
    }
  }

  public async reset(req: Request, res: Response) {
    const { confirm_hash } = req?.query;
    if (!confirm_hash)
      return response.failed('Confirm has is required', 422, res);
    const { password } = req?.body;
    if (!password) return response.failed('Password is required', 422, res);

    try {
      const result = await repository.detail({
        confirm_hash: confirm_hash,
      });
      if (!result) return response.failed('Data not found', 404, res);

      let newPassword: any = null;
      const isMatch: boolean = await helper.compareIt(
        password,
        result?.getDataValue('password')
      );
      if (!isMatch) {
        newPassword = await helper.hashIt(password);
      } else {
        return response.failed('Password does not same old', 500, res);
      }

      await repository.update({
        payload: {
          password: newPassword,
          modified_date: date,
        },
        condition: { confirm_hash: confirm_hash },
      });

      return response.success('success reset password', null, res);
    } catch (err: any) {
      return helper.catchError(`reset: ${err?.message}`, 500, res);
    }
  }

  public async logout(req: Request, res: Response) {
    try {
      const user = req?.user;

      await repository.update({
        payload: { token: null },
        condition: { resource_id: user?.resource_id },
      });
      return response.success('logout success', null, res);
    } catch (err: any) {
      return helper.catchError(`logout: ${err?.message}`, 500, res);
    }
  }
}

export const auth = new Controller();
