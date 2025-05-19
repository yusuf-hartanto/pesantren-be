'use strict';

import moment from 'moment';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { helper } from '../../helpers/helper';
import { response } from '../../helpers/response';
import { appConfig } from '../../config/config.app';
import { helperauth } from '../../helpers/auth.helper';
import { repository as repoOtp } from './otp.repository';
import { variable } from '../app/resource/resource.variable';
import { repository } from '../app/resource/resource.repository';
import { transformer } from '../app/resource/resource.transformer';
import { repository as repoRole } from '../app/role/role.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  REQUIRED,
  ROLE_CLIENT,
} from '../../utils/constant';

moment().locale('id');
const date: string = helper.date();
const otpExpired: number = 15;

export default class Controller {
  public async login(req: Request, res: Response) {
    const user = req?.user;

    const isMatch = await helper.compareIt(req?.body?.password, user?.password);
    if (isMatch) {
      try {
        const date = helper.date();
        const email: string = user?.getDataValue('email');

        const code = helper.random(1000, 9999);
        const expired = helper.dateAdd(otpExpired, 'minutes');
        const check = await repoOtp.detail({ email });

        if (check) {
          await repoOtp.update({
            payload: {
              code: code,
              status: 0,
              expired: expired,
              modified_date: date,
            },
            condition: { email: email },
          });
        } else {
          await repoOtp.create({
            payload: {
              email: email,
              code: code,
              expired: expired,
              created_date: date,
            },
          });
        }

        await helper.sendEmail({
          to: email,
          subject: `OTP Email - ${appConfig?.app}`,
          content: `
            <h3>Hi ${user?.getDataValue('full_name')},</h3>
            <p>Here is your OTP code:</p>
            <h1>${code}</h1>
            <p>This code is valid for ${otpExpired} minutes.</p>
            <p>For security reasons, do not give your OTP code to anyone!</p>
          `,
        });
        await helper.sendNotif(
          `Hi ${user?.getDataValue('full_name')}, Here is your OTP code: ${code} This code is valid for ${otpExpired} minutes. For security reasons, do not give your OTP code to anyone!`
        );

        return response.success(
          'Login success',
          'Please check your email for OTP',
          res
        );
      } catch (err: any) {
        return helper.catchError(`login: ${err?.message}`, 500, res);
      }
    } else {
      return response.failed('Password incorrect', 400, res);
    }
  }

  public async refresh(req: Request, res: Response) {
    const result = await repository.detail(
      {
        resource_id: req?.user?.id,
      },
      ''
    );
    if (!result) return response.success(NOT_FOUND, null, res, false);

    try {
      const payload = {
        id: result?.getDataValue('resource_id'),
        username: result?.getDataValue('username'),
        province_id: result?.getDataValue('area_province_id'),
        regency_id: result?.getDataValue('area_regencies_id'),
        role_name: result?.getDataValue('role')?.role_name,
      };

      const newToken: string = helperauth.newToken(payload);
      const data: Object = {
        userdata: await transformer.detail(result),
        access_token: newToken,
        refresh_token: req?.body?.refresh_token,
      };

      await repository.update({
        payload: {
          token: newToken,
          token_expired: helper.dateAdd(7, 'days'),
        },
        condition: { resource_id: req?.user?.id },
      });
      console.warn('refresh token', data);
      response.success('New access token', data, res);
    } catch (err: any) {
      return helper.catchError(`refresh: ${err?.message}`, 500, res);
    }
  }

  public async register(req: Request, res: Response) {
    let confirm_hash: string = '';
    let message: string = '';
    let username: string = req?.body?.username || '';

    try {
      const checkEmail = await repository.check({
        email: { [Op.like]: `%${req?.body?.email}%` },
      });
      if (checkEmail) return response.failed(ALREADY_EXIST, 400, res);

      if (!username || username == undefined) {
        username = req?.body?.email.split('@')[0];
        const checkUsername = await repository.check({
          username: username,
        });
        if (checkUsername) username = username + helper.random(100, 999);
      }

      confirm_hash = await helper.hashIt(username, 6);
      const password: string = await helper.hashIt(req?.body?.password);
      const only: Object = helper.only(variable.fillable(), req?.body);

      const role = await repoRole.detail({
        role_name: { [Op.like]: `%${ROLE_CLIENT}%` },
      });

      const { province_id, regency_id } = req?.body;
      await repository.create({
        payload: {
          ...only,
          username: username,
          password: password,
          confirm_hash: confirm_hash,
          area_province_id: province_id?.value || null,
          area_regencies_id: regency_id?.value || null,
          role_id: role?.getDataValue('role_id') || null,
          created_by: req?.user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });

      message = 'success register';
    } catch (err: any) {
      return helper.catchError(`register: ${err?.message}`, 500, res);
    }

    try {
      await helper.sendEmail({
        to: req?.body?.email,
        subject: `Welcome to ${appConfig?.app}`,
        content: `
          <h3>Hi ${req?.body?.full_name},</h3>
          <p>Congratulation to join as a member, below this link to activation your account:</p>
          <a href="${appConfig?.baseUrlFe}/auth/account-verification?confirm_hash=${confirm_hash}" target="_blank">Activation</a>
          <p>This is your username account: <b>${username}</b></p>
        `,
      });
      await helper.sendNotif(
        `Welcome to ${appConfig?.app}. Hi ${req?.body?.full_name}, Congratulation to join as a member, below this link to activation your account: ${appConfig?.baseUrlFe}/auth/account-verification?confirm_hash=${confirm_hash}. This is your username account: ${username}`
      );
    } catch (err: any) {
      message = `<br /> error send email: ${err?.message}`;
    }

    return response.success(message, null, res);
  }

  public async verify(req: Request, res: Response) {
    const { confirm_hash } = req.query;
    const { password, password_confirmation } = req?.body;
    if (!confirm_hash)
      return response.failed(`confirm hash ${REQUIRED}`, 422, res);
    if (!password) return response.failed(`password ${REQUIRED}`, 422, res);
    if (!password_confirmation)
      return response.failed(`password confirmation ${REQUIRED}`, 422, res);
    if (password != password_confirmation)
      return response.failed('password confirmation does not match', 400, res);

    try {
      const result = await repository.detail({ confirm_hash }, '');
      if (!result) return response.success(NOT_FOUND, null, res, false);

      if (result?.getDataValue('status') === 'A')
        return response.failed('Account has been verified', 400, res);

      const newPassword = await helper.hashIt(password);
      await repository.update({
        payload: {
          status: 'A',
          password: newPassword,
        },
        condition: { confirm_hash },
      });

      return response.success('Account verified', null, res);
    } catch (err: any) {
      return helper.catchError(`verify: ${err?.message}`, 500, res);
    }
  }

  public async forgot(req: Request, res: Response) {
    try {
      const { email } = req?.body;
      if (!email) return response.failed(`Email ${REQUIRED}`, 422, res);

      const result = await repository.detail({ email }, '');
      if (!result) return response.success(NOT_FOUND, null, res, false);

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
          <a href="${appConfig?.baseUrlFe}/reset-password?confirm_hash=${confirm_hash}" target="_blank">Reset Password</a>
        `,
      });
      await helper.sendNotif(
        `Reset Password. Hi ${result?.getDataValue('full_name')}, Below this link to reset password your account: ${appConfig?.baseUrlFe}/reset-password?confirm_hash=${confirm_hash}`
      );

      return response.success(
        'success forgot password',
        'Please check your email for reset password',
        res
      );
    } catch (err: any) {
      return helper.catchError(`forgot: ${err?.message}`, 500, res);
    }
  }

  public async reset(req: Request, res: Response) {
    const { confirm_hash } = req?.query;
    if (!confirm_hash)
      return response.failed(`Confirm hash ${REQUIRED}`, 422, res);
    const { password } = req?.body;
    if (!password) return response.failed(`Password ${REQUIRED}`, 422, res);

    try {
      const result = await repository.detail({ confirm_hash }, '');
      if (!result) return response.success(NOT_FOUND, null, res, false);

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
        condition: { confirm_hash },
      });

      return response.success('success reset password', null, res);
    } catch (err: any) {
      return helper.catchError(`reset: ${err?.message}`, 500, res);
    }
  }

  public async logout(req: Request, res: Response) {
    try {
      const user = req?.user;

      if (user && user?.id) {
        await repository.update({
          payload: { token: null, token_expired: null },
          condition: { resource_id: user?.id },
        });
      }
      return response.success('logout success', null, res);
    } catch (err: any) {
      return helper.catchError(`logout: ${err?.message}`, 500, res);
    }
  }

  public async verifyOtp(req: Request, res: Response) {
    try {
      let status = 1;
      const date = helper.date();
      const { otp } = req?.body;

      if (!otp) return response.failed(`Code OTP ${REQUIRED}`, 422, res);

      const check = await repoOtp.detail({ code: otp, status: 0 });
      if (!check)
        return response.success('Data OTP not found', null, res, false);

      if (otp != check?.getDataValue('code'))
        return response.failed('Code OTP incorrect', 400, res);

      const now = moment();
      const expired = moment(check?.getDataValue('expired'));
      if (expired.isBefore(now)) status = 3;

      await repoOtp.update({
        payload: {
          status: status,
          modified_date: date,
        },
        condition: { code: otp },
      });

      if (status == 3) return response.failed('Code OTP expired', 400, res);

      const user = await repository.detail(
        { email: check?.getDataValue('email') },
        ''
      );
      if (!user) return response.success(NOT_FOUND, null, res, false);

      const role = user?.getDataValue('role');
      const payload: Object = {
        id: user?.getDataValue('resource_id'),
        username: user?.getDataValue('username'),
        province_id: user?.getDataValue('area_province_id'),
        regency_id: user?.getDataValue('area_regencies_id'),
        role_name: role?.getDataValue('role_name'),
      };

      const token: string = helperauth.newToken(payload);
      const refresh: string = await helperauth.newToken({
        id: user?.getDataValue('resource_id'),
      });
      const getUser: Object = await transformer.detail(user);
      const totalLogin: Number = user?.total_login + 1;

      await repository.update({
        payload: {
          token: token,
          token_expired: helper.dateAdd(7, 'days'),
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
      console.warn('login success', data);
      return response.success('verify otp success', data, res);
    } catch (err: any) {
      return helper.catchError(`verify otp: ${err?.message}`, 500, res);
    }
  }
}

export const auth = new Controller();
