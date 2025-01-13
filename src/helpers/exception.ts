'use strict';

import { response } from './response';
import { Request, Response, NextFunction } from 'express';

const exception = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let resData;
  if (err?.name === 'JsonSchemaValidationError') {
    let property = err?.validationErrors?.body[0]?.dataPath.replace(/[.]/g, '');
    let message = err?.validationErrors?.body[0]?.message;
    if (!property) {
      property = err?.validationErrors?.body[0]?.params?.missingProperty;
    }
    response.failed(message, 422, res);
    res.json(resData);
  } else if (err?.name === 'ReferenceError') {
    res.json({});
  } else {
    next(err);
  }
};
export default exception;
