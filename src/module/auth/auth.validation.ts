'use strict';

import { response } from '../../helpers/response';
import { Request, Response, NextFunction } from 'express';

export default class Validation {
  public async register(req: Request, res: Response, next: NextFunction) {
    const regexp = new RegExp(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

    const { full_name, email, password, confirm_password } = req?.body;
    if (!full_name) return response.failed('Full Name is required', 422, res);
    if (!email) return response.failed('Email is required', 422, res);
    if (!regexp.test(email))
      return response.failed('Email invalid format', 422, res);
    if (!password) return response.failed('Password is required', 422, res);
    if (password != confirm_password)
      return response.failed(
        `Confirm password doesn't match password`,
        422,
        res
      );

    next();
  }
}
export const validation = new Validation();
