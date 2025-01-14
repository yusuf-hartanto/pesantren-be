'use strict';

import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { helper } from '../../helpers/helper';
import { response } from '../../helpers/response';
import { helperauth } from '../../helpers/auth.helper';
import { Request, Response, NextFunction } from 'express';
import { repository } from '../app/resource/resource.repository';

dotenv.config();
type RequestBody<T> = Request<{}, {}, T>;
interface UserBody {
  username: string;
  password: string;
}

export default class Middleware {
  public async checkBearerToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const authorization: string = req?.headers['authorization'] || '';
    const token: string = await helperauth.decodeBearerToken(authorization);
    if (token === '')
      return response.failed('Auth Bearer is required', 422, res);

    try {
      const auth = helperauth.decodeToken(token);
      if (typeof auth == 'string')
        return response.failed('Invalid token', 400, res);

      const admin: string =
        auth?.role_name == 'administrator' ? '' : 'administrator';
      const user = await repository.detail({ token }, admin);
      if (!user) return response.failed('Unauthorized', 401, res);

      req.user = auth;
      next();
      return;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return response.failed(err?.message, 401, res);
      } else {
        return helper.catchError(
          `check token invalid: ${err?.message}`,
          401,
          res
        );
      }
    }
  }

  public async checkRefreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      req.user = helperauth.decodeRefreshToken(req?.body?.refresh_token);
      next();
      return;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        return response.failed(err?.message, 401, res);
      } else {
        return helper.catchError(
          `check refresh token invalid: ${err?.message}`,
          401,
          res
        );
      }
    }
  }

  public async checkExpiredToken(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const authorization: string = req?.headers['authorization'] || '';
    const token: string = helperauth.decodeBearerToken(authorization);
    if (token === '')
      return response.failed('Auth Bearer is Required', 422, res);

    try {
      const user = await repository.detail({ token }, '');
      if (!user) return response.failed('Unauthorized', 401, res);

      req.user = helperauth.decodeToken(token);
      next();
      return;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        req.user = helperauth.decodeExpiredToken(token);
        next();
        return;
      } else {
        return helper.catchError(
          `check expired token invalid: ${err?.message}`,
          401,
          res
        );
      }
    }
  }

  public async checkVerify(
    req: RequestBody<UserBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const username: string = req?.body?.username;
      const password: string = req?.body?.password;
      if (!username || !password)
        return response.failed('Username or password is required', 422, res);

      const result = await repository.detail(
        {
          [Op.or]: [{ email: username }, { username: username }],
        },
        ''
      );
      if (!result) return response.failed('Data not found', 404, res);

      if (result?.getDataValue('status') === 'A') {
        req.user = result;
        next();
        return;
      } else {
        return response.failed('Your account need verification', 400, res);
      }
    } catch (err: any) {
      return helper.catchError(`check verify: ${err?.message}`, 400, res);
    }
  }

  public async checkToken(req: Request, res: Response, next: NextFunction) {
    const authorization: string = req?.headers['authorization'] || '';
    const token: string = await helperauth.decodeBearerToken(authorization);

    try {
      const auth: any = helperauth.decodeToken(token);
      req.user = auth;

      next();
      return;
    } catch (err) {
      req.user = null;
      next();
    }
  }
}

export const auth = new Middleware();
