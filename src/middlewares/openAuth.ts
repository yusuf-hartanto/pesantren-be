'use strict';

import crypto from 'crypto';
import { response } from '../helpers/response';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.SITRENDI_SECRET_KEY || 'pesantren_key';

export const verifyOpenApiSignature = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];

    if (!timestamp || !signature) {
      return response.failed(
        'Unauthorized: Missing X-Timestamp or X-Signature header',
        401,
        res
      );
    }

    if (!SECRET_KEY) {
      return response.failed(
        'Server Error: Secret key is not configured',
        500,
        res
      );
    }

    const timestampValue = parseInt(timestamp as string, 10);
    const timestampNow = Math.floor(Date.now() / 1000);

    if (
      isNaN(timestampValue) ||
      Math.abs(timestampNow - timestampValue) > 300
    ) {
      return response.failed(
        'Unauthorized: Timestamp expired or invalid',
        401,
        res
      );
    }

    let rawBody = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.rawBody && req.rawBody.length > 0) {
        rawBody = req.rawBody.toString('utf-8');
      } else if (req.body && Object.keys(req.body).length > 0) {
        rawBody = JSON.stringify(req.body);
      }
    }

    const computedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update((timestamp as string) + rawBody)
      .digest('hex');

    const bufferComputed = Buffer.from(computedSignature, 'utf-8');
    const bufferReceived = Buffer.from(signature as string, 'utf-8');

    if (
      bufferComputed.length !== bufferReceived.length ||
      !crypto.timingSafeEqual(bufferComputed, bufferReceived)
    ) {
      return response.failed('Unauthorized: Invalid signature', 401, res);
    }

    next();
  } catch (err: any) {
    return response.failed(
      `Internal server error in signature verification: ${err.message}`,
      500,
      res
    );
  }
};
