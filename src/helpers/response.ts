'use strict';

import { Response } from 'express';

export default class DataResponse {
  public success(message: string, data: any, res: Response, status: boolean = true) {
    res.json({
      status: status,
      message: message,
      data: data,
    });
    res.end();
  }

  public failed(message: any, code: number, res: Response) {
    res.status(code);
    res.json({
      status: false,
      message: message,
    });
    res.end();
  }
}

export const response = new DataResponse();
